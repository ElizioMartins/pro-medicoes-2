import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Obter token do localStorage
  const authToken = localStorage.getItem('authToken');
  
  // Se existe token, adicionar ao header
  if (authToken) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${authToken}`)
    });
    return next(authReq);
  }
  
  // Se não tem token, enviar requisição original
  return next(req);
};
