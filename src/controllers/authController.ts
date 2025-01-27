import { Request, Response } from "express";
import { User } from "../models/user";
import jwt from "jsonwebtoken";

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findUserByEmail(email);

    if (!user) {
      res.status(404).json({ message: "Usuário não encontrado" });
      return;
    }

    const isPasswordMatched = await User.validatePassword(password, user.password);

    if (!isPasswordMatched) {
      res.status(400).json({ message: "Senha incorreta" });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    res.status(200).json({ success: true, message: "Login realizado com sucesso!", token });
  } catch (error) {
    res.status(500).json({ message: "Erro ao realizar login" });
  }
};