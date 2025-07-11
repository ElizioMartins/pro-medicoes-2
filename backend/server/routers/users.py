from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from dbmodels.database import get_db
from dbmodels.users import User, UserCreate, UserUpdate, UserResponse, UserRole
from auth import verify_password, get_password_hash, create_access_token
from dependencies import get_current_user, get_admin_user, get_manager_or_admin

router = APIRouter()

def can_view_user(current_user: User, target_user: User) -> bool:
    """
    Verifica se o usuário atual pode visualizar o usuário alvo.
    - Admin: pode ver todos
    - Manager: pode ver todos abaixo dele (Reader, User) + ele mesmo
    - Reader/User: pode ver apenas ele mesmo
    """
    if current_user.role == UserRole.ADMIN:
        return True
    elif current_user.role == UserRole.MANAGER:
        return (target_user.role in [UserRole.READER, UserRole.USER] or 
                target_user.id == current_user.id)
    else:
        return target_user.id == current_user.id

def can_edit_user(current_user: User, target_user: User) -> bool:
    """
    Verifica se o usuário atual pode editar o usuário alvo.
    - Admin: pode editar todos
    - Manager: pode editar todos abaixo dele (Reader, User) + ele mesmo
    - Reader/User: pode editar apenas ele mesmo (campos limitados)
    """
    if current_user.role == UserRole.ADMIN:
        return True
    elif current_user.role == UserRole.MANAGER:
        return (target_user.role in [UserRole.READER, UserRole.USER] or 
                target_user.id == current_user.id)
    else:
        return target_user.id == current_user.id

def can_delete_user(current_user: User, target_user: User) -> bool:
    """
    Verifica se o usuário atual pode excluir o usuário alvo.
    - Admin: pode excluir todos (exceto ele mesmo)
    - Manager: pode excluir todos abaixo dele (Reader, User)
    - Reader/User: não pode excluir ninguém
    """
    if current_user.role == UserRole.ADMIN:
        return target_user.id != current_user.id  # Admin não pode excluir a si mesmo
    elif current_user.role == UserRole.MANAGER:
        return target_user.role in [UserRole.READER, UserRole.USER]
    else:
        return False

def get_allowed_fields_for_update(current_user: User, target_user: User) -> List[str]:
    """
    Retorna os campos que o usuário atual pode atualizar no usuário alvo.
    """
    if current_user.role == UserRole.ADMIN:
        return ["username", "email", "name", "password", "role", "status", "active"]
    elif current_user.role == UserRole.MANAGER:
        if target_user.id == current_user.id:
            # Manager editando a si mesmo
            return ["name", "email", "password"]
        else:
            # Manager editando subordinados
            return ["username", "email", "name", "password", "role", "status", "active"]
    else:
        # Reader/User editando a si mesmo
        return ["name", "email", "password"]

@router.post("/login")
def login(username: str, password: str, db: Session = Depends(get_db)):
    """
    Endpoint de login para autenticação de usuários.
    Retorna um token JWT válido.
    """
    user = db.query(User).filter(
        (User.username == username) | (User.email == username)
    ).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    
    if not user.active:
        raise HTTPException(status_code=401, detail="Usuário inativo")
    
    # Verificar senha criptografada
    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Senha incorreta")
    
    # Atualizar último acesso
    user.last_access = datetime.utcnow()
    db.commit()
    
    # Criar token JWT
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "status": user.status,
            "active": user.active,
            "lastAccess": user.last_access,
            "initials": user.initials,
            "avatarColor": user.avatar_color,
            "created_at": user.created_at,
            "updated_at": user.updated_at
        }
    }

@router.get("", response_model=dict)
def get_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100, alias="pageSize"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista usuários com base nas permissões de role.
    """
    skip = (page - 1) * page_size
    
    # Filtrar usuários com base no role
    if current_user.role == UserRole.ADMIN:
        # Admin vê todos os usuários
        users_query = db.query(User)
    elif current_user.role == UserRole.MANAGER:
        # Manager vê apenas usuários abaixo dele + ele mesmo
        users_query = db.query(User).filter(
            (User.role.in_([UserRole.READER, UserRole.USER])) | 
            (User.id == current_user.id)
        )
    else:
        # Reader/User vê apenas ele mesmo
        users_query = db.query(User).filter(User.id == current_user.id)
    
    users = users_query.offset(skip).limit(page_size).all()
    total = users_query.count()
    
    return {
        "users": [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "status": user.status,
                "active": user.active,
                "lastAccess": user.last_access,
                "created_at": user.created_at,
                "updated_at": user.updated_at
            }
            for user in users
        ],
        "total": total
    }

@router.get("/search")
def search_users(
    search_term: str = Query("", alias="searchTerm"),
    role: str = Query("all"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100, alias="pageSize"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Busca usuários com base nas permissões de role.
    """
    skip = (page - 1) * page_size
    
    # Filtrar usuários com base no role
    if current_user.role == UserRole.ADMIN:
        # Admin vê todos os usuários
        users_query = db.query(User)
    elif current_user.role == UserRole.MANAGER:
        # Manager vê apenas usuários abaixo dele + ele mesmo
        users_query = db.query(User).filter(
            (User.role.in_([UserRole.READER, UserRole.USER])) | 
            (User.id == current_user.id)
        )
    else:
        # Reader/User vê apenas ele mesmo
        users_query = db.query(User).filter(User.id == current_user.id)
    
    # Aplicar filtros de busca
    if search_term:
        users_query = users_query.filter(
            (User.name.ilike(f"%{search_term}%")) | 
            (User.username.ilike(f"%{search_term}%")) | 
            (User.email.ilike(f"%{search_term}%"))
        )
    
    if role != "all":
        users_query = users_query.filter(User.role == role)
    
    users = users_query.offset(skip).limit(page_size).all()
    total = users_query.count()
    
    return {
        "users": [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "status": user.status,
                "active": user.active,
                "lastAccess": user.last_access,
                "created_at": user.created_at,
                "updated_at": user.updated_at
            }
            for user in users
        ],
        "total": total
    }
    query = db.query(User)
    if search_term:
        query = query.filter(
            (User.username.ilike(f"%{search_term}%")) |
            (User.email.ilike(f"%{search_term}%")) |
            (User.name.ilike(f"%{search_term}%"))
        )
    
    if role != "all":
        query = query.filter(User.role == role)
    
    total = query.count()
    skip = (page - 1) * page_size
    users = query.offset(skip).limit(page_size).all()
    
    return {
        "users": [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "status": user.status,
                "active": user.active,
                "lastAccess": user.last_access,
                "created_at": user.created_at,
                "updated_at": user.updated_at
            }
            for user in users
        ],
        "total": total
    }

@router.post("/", response_model=dict)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cria um novo usuário. Apenas administradores e gerentes podem criar usuários.
    """
    # Verificar permissões
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=403, 
            detail="Sem permissão para criar usuários"
        )
    # Verificar se username já existe
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username já existe")
    
    # Verificar se email já existe
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email já existe")
    
    # Criar usuário
    db_user = User(
        username=user.username,
        email=user.email,
        name=user.name,
        password_hash=get_password_hash(user.password),
        role=user.role,
        status=user.status,
        active=user.active,
        initials=user.name[:2].upper() if user.name else "??",
        avatar_color=f"#{''.join([f'{ord(c):02x}' for c in user.name[:3]])}".ljust(7, '0')
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return {
        "id": db_user.id,
        "username": db_user.username,
        "email": db_user.email,
        "name": db_user.name,
        "role": db_user.role,
        "status": db_user.status,
        "active": db_user.active,
        "created_at": db_user.created_at
    }

@router.get("/me")
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Retorna informações do usuário atual.
    """
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "status": current_user.status,
        "active": current_user.active,
        "lastAccess": current_user.last_access,
        "initials": current_user.initials,
        "avatarColor": current_user.avatar_color,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at
    }

@router.put("/{user_id}")
def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Atualiza um usuário com base nas permissões de role.
    """
    # Buscar usuário alvo
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Verificar permissões
    if not can_edit_user(current_user, db_user):
        raise HTTPException(status_code=403, detail="Sem permissão para editar este usuário")
    
    # Obter campos permitidos para atualização
    allowed_fields = get_allowed_fields_for_update(current_user, db_user)
    
    # Validar e atualizar campos
    if user_update.username and "username" in allowed_fields:
        if user_update.username != db_user.username:
            if db.query(User).filter(User.username == user_update.username, User.id != user_id).first():
                raise HTTPException(status_code=400, detail="Username já existe")
            db_user.username = user_update.username
    elif user_update.username and "username" not in allowed_fields:
        raise HTTPException(status_code=403, detail="Sem permissão para alterar username")
    
    if user_update.email and "email" in allowed_fields:
        if user_update.email != db_user.email:
            if db.query(User).filter(User.email == user_update.email, User.id != user_id).first():
                raise HTTPException(status_code=400, detail="Email já existe")
            db_user.email = user_update.email
    elif user_update.email and "email" not in allowed_fields:
        raise HTTPException(status_code=403, detail="Sem permissão para alterar email")
    
    if user_update.name and "name" in allowed_fields:
        db_user.name = user_update.name
        db_user.initials = user_update.name[:2].upper()
    elif user_update.name and "name" not in allowed_fields:
        raise HTTPException(status_code=403, detail="Sem permissão para alterar nome")
    
    if user_update.password and "password" in allowed_fields:
        db_user.password_hash = get_password_hash(user_update.password)
    elif user_update.password and "password" not in allowed_fields:
        raise HTTPException(status_code=403, detail="Sem permissão para alterar senha")
    
    if user_update.role and "role" in allowed_fields:
        db_user.role = user_update.role
    elif user_update.role and "role" not in allowed_fields:
        raise HTTPException(status_code=403, detail="Sem permissão para alterar role")
    
    if user_update.status and "status" in allowed_fields:
        db_user.status = user_update.status
    elif user_update.status and "status" not in allowed_fields:
        raise HTTPException(status_code=403, detail="Sem permissão para alterar status")
    
    if user_update.active is not None and "active" in allowed_fields:
        db_user.active = user_update.active
    elif user_update.active is not None and "active" not in allowed_fields:
        raise HTTPException(status_code=403, detail="Sem permissão para alterar status ativo")
    
    db_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_user)
    
    return {
        "id": db_user.id,
        "username": db_user.username,
        "email": db_user.email,
        "name": db_user.name,
        "role": db_user.role,
        "status": db_user.status,
        "active": db_user.active,
        "updated_at": db_user.updated_at
    }

@router.delete("/{user_id}")
def delete_user(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Exclui um usuário com base nas permissões de role.
    Apenas Admin e Manager podem excluir usuários.
    """
    # Buscar usuário alvo
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Verificar permissões
    if not can_delete_user(current_user, db_user):
        raise HTTPException(status_code=403, detail="Sem permissão para excluir este usuário")
    
    db.delete(db_user)
    db.commit()
    return {"message": "Usuário excluído com sucesso"}

@router.get("/{user_id}")
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtém um usuário específico por ID com base nas permissões de role.
    """
    # Buscar usuário
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Verificar permissões
    if not can_view_user(current_user, db_user):
        raise HTTPException(status_code=403, detail="Sem permissão para visualizar este usuário")
    
    return {
        "id": db_user.id,
        "username": db_user.username,
        "email": db_user.email,
        "name": db_user.name,
        "role": db_user.role,
        "status": db_user.status,
        "active": db_user.active,
        "lastAccess": db_user.last_access,
        "initials": db_user.initials,
        "avatarColor": db_user.avatar_color,
        "created_at": db_user.created_at,
        "updated_at": db_user.updated_at
    }
