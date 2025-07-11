from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
from auth import verify_token
from dbmodels.database import get_db
from dbmodels.users import User, UserRole

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Obtém o usuário atual com base no token JWT.
    """
    token = credentials.credentials
    payload = verify_token(token)
    
    username: str = payload.get("sub")
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
        )
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado",
        )
    
    if not user.active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário inativo",
        )
    
    return user

def require_roles(allowed_roles: List[UserRole]):
    """
    Decorator factory para verificar se o usuário tem uma das roles permitidas.
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acesso negado. Roles permitidas: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker

# Dependências específicas por role
def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Verifica se o usuário é admin.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores"
        )
    return current_user

def get_manager_or_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Verifica se o usuário é manager ou admin.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores e gerentes"
        )
    return current_user

def get_reader_or_above(current_user: User = Depends(get_current_user)) -> User:
    """
    Verifica se o usuário é leiturista ou acima.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER, UserRole.READER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a leituristas, gerentes e administradores"
        )
    return current_user

def get_any_authenticated_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Verifica se o usuário está autenticado (qualquer role).
    """
    return current_user
