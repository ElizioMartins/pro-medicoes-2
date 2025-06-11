from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from dbmodels.database import get_db
from dbmodels.users import User, UserCreate, UserUpdate, UserResponse, UserRole

router = APIRouter()

@router.get("", response_model=dict)
def get_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100, alias="pageSize"),
    db: Session = Depends(get_db)
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

@router.post("", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # TODO: Adicionar lógica para criptografar a senha
    db_user = User(
        username=user.username,
        email=user.email,
        password_hash=user.password,  # TODO: Criptografar a senha
        active=user.active,
        name=user.name,
        role=user.role,
        status=user.status
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    for key, value in user_update.dict(exclude_unset=True).items():
        if key == "password" and value:
            # TODO: Adicionar lógica para criptografar a senha
            setattr(db_user, "password_hash", value)
        else:
            setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    db.delete(user)
    db.commit()
    return {"message": "Usuário excluído com sucesso"}
