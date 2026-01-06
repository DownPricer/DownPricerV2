from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from auth import decode_access_token
from models import TokenData, UserRole
from typing import List

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenData:
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré"
        )
    
    email = payload.get("sub")
    roles = payload.get("roles", [])
    
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide"
        )
    
    return TokenData(email=email, roles=roles)

def require_roles(required_roles: List[UserRole]):
    async def role_checker(current_user: TokenData = Depends(get_current_user)):
        user_roles = [UserRole(role) for role in current_user.roles]
        
        if not any(role in user_roles for role in required_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès interdit : rôle insuffisant"
            )
        
        return current_user
    
    return role_checker
