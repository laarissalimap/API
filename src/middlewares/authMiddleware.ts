import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Middleware de autenticação (verifica o token JWT)
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authorizationHeader = req.headers["authorization"];
    if (!authorizationHeader) {
      console.error("Erro: Cabeçalho Authorization ausente.");
      res.status(401).json({ error: "Token não fornecido no cabeçalho Authorization." });
      return;
    }

    const token = authorizationHeader.split(" ")[1];
    if (!token) {
      console.error("Erro: Token ausente no cabeçalho Authorization.");
      res.status(401).json({ error: "Formato do cabeçalho Authorization inválido. Token ausente." });
      return;
    }

    jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
      if (err) {
        console.error("Erro ao verificar token:", err.message);
        res.status(401).json({ error: "Token inválido ou expirado." });
        return;
      }

      // Adiciona os dados do usuário ao objeto `req`
      (req as any).user = decoded;
      next();
    });
  } catch (error) {
    console.error("Erro inesperado no middleware de autenticação:", error);
    res.status(500).json({ error: "Erro interno ao processar a autenticação." });
  }
};

// Middleware de autorização (verifica a role do usuário)
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = (req as any).user;
      if (!user) {
        console.error("Erro: Usuário não autenticado.");
        res.status(401).json({ error: "Usuário não autenticado. Realize o login novamente." });
        return;
      }

      const userRole = user.role;
      if (!roles.includes(userRole)) {
        console.error(`Erro: Acesso negado para role '${userRole}'. Requerido: ${roles.join(", ")}`);
        res.status(403).json({
          error: "Acesso negado.",
          message: `Seu perfil (${userRole}) não tem permissão para acessar esta rota.`,
        });
        return;
      }

      next();
    } catch (error) {
      console.error("Erro inesperado no middleware de autorização:", error);
      res.status(500).json({ error: "Erro interno ao processar a autorização." });
    }
  };
};