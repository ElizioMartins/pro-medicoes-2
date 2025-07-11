from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from dbmodels.database import get_db
from dbmodels.users import User, UserCreate, UserUpdate, UserResponse, UserRole
from auth import verify_password, get_password_hash, create_access_token
from dependencies import get_current_user, get_admin_user, get_manager_or_admin

router = APIRouter()

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
    current_user: User = Depends(get_manager_or_admin)  # Apenas managers e admins
):
    skip = (page - 1) * page_size
    users = db.query(User).offset(skip).limit(page_size).all()
    total = db.query(User).count()
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
    db: Session = Depends(get_db)
):
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
    current_user: User = Depends(get_admin_user)  # Apenas admins podem criar usuários
):
    """
    Cria um novo usuário. Apenas administradores podem criar usuários.
    """
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
    current_user: User = Depends(get_admin_user)  # Apenas admins podem atualizar usuários
):
    """
    Atualiza um usuário. Apenas administradores podem atualizar usuários.
    """
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Atualizar campos
    if user_update.username and user_update.username != db_user.username:
        if db.query(User).filter(User.username == user_update.username, User.id != user_id).first():
            raise HTTPException(status_code=400, detail="Username já existe")
        db_user.username = user_update.username
    
    if user_update.email and user_update.email != db_user.email:
        if db.query(User).filter(User.email == user_update.email, User.id != user_id).first():
            raise HTTPException(status_code=400, detail="Email já existe")
        db_user.email = user_update.email
    
    if user_update.name:
        db_user.name = user_update.name
        db_user.initials = user_update.name[:2].upper()
    
    if user_update.password:
        db_user.password_hash = get_password_hash(user_update.password)
    
    if user_update.role:
        db_user.role = user_update.role
    
    if user_update.status:
        db_user.status = user_update.status
    
    if user_update.active is not None:
        db_user.active = user_update.active
    
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
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    db.delete(user)
    db.commit()
    return {"message": "Usuário excluído com sucesso"}
