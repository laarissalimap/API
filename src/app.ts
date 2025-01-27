import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { login } from "./controllers/authController";
import { authenticate, authorize } from "./middlewares/authMiddleware";
import { User } from "./models/user";

dotenv.config();

const app: Application = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Rota de login
app.post("/users/login", login);

// Rota para administradores
app.get("/admin", authenticate, authorize(["Admin"]), (req: Request, res: Response) => {
  res.json({ message: "Bem-vindo, Administrador!" });
});

// Rota para gerentes e administradores
app.get("/manager", authenticate, authorize(["Manager", "Admin"]), (req: Request, res: Response) => {
  res.json({ message: "Bem-vindo, Gerente!" });
});

/*// Exemplo de rota pública
app.get("/public", (req: Request, res: Response) => {
  res.json({ message: "Bem-vindo à área pública!" });
});

// Rota protegida
app.get("/protected", authenticate, (req: Request, res: Response) => {
  res.json({ message: "Acesso autorizado!" });
});*/

// Rota de usuários
app.get("/users", async (req: Request, res: Response) => {
  try {
    const users = await User.findAllUsers();
    res.json({ success: true, payload: users });
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar usuários" });
  }
});

app.get("/users/:id", async (req, res: any) => {
  try {
    const { id } = req.params;
    const user = await User.findUserById(id);

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    res.json({ success: true, payload: user });
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar usuário" });
  }
});

app.post("/users", async (req: Request, res: Response) => {
  try {
    const newUser = await User.createUser(req.body);
    res.status(201).json({ success: true, payload: newUser });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: "Erro ao criar usuário", error: error.message });
    } else {
      res.status(500).json({ message: "Erro inesperado" });
    }
  }
});

app.put("/users/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedUser = await User.updateUser(id, req.body);
    res.json({ success: true, payload: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar usuário" });
  }
});

app.delete("/users/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.deleteUser(id);
    res.json({ success: true, payload: deletedUser });
  } catch (error) {
    res.status(500).json({ message: "Erro ao deletar usuário" });
  }
});

app.listen(PORT, () => {
  console.log(`🗄️  Servidor rodando em http://localhost:${PORT}`);
});
