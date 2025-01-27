import { PrismaClient, AddressType, Role } from "@prisma/client";
import { hash, compare } from "bcryptjs";

const prisma = new PrismaClient();

export const User = {
  async createUser(data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    date_of_birth: Date;
    cpf: string;
    addressType: AddressType;
    role: Role
  }) {
    const hashedPassword = await hash(data.password, 10);

    return await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
        date_of_birth: data.date_of_birth,
        cpf: data.cpf,
        role: data.role,
        addresses: {
          create: [{
            address: data.address,
            city: data.city,
            state: data.state,
            postalCode: data.postalCode,
            country: data.country,
            type: data.addressType,
          }]
        }
      }
    });
  },

  async findAllUsers() {
    return await prisma.user.findMany();
  },

  async findUserById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
    });
  },

  async findUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
    });
  },

  async updateUser(
    id: string,
    data: Partial<{
      name: string;
      email: string;
      password: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      addressType: AddressType;
    }>
  ) {
    const updatedData: any = { ...data };

    // Se a senha for fornecida, a criptografa
    if (data.password) {
      updatedData.password = await hash(data.password, 10);
    }

    let user;
    try {
      user = await prisma.user.update({
        where: { id },
        data: {
          name: updatedData.name,
          email: updatedData.email,
          phone: updatedData.phone,
          password: updatedData.password
        },
      });
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      throw new Error("Erro ao atualizar usuário");
    }

    // Atualizando o endereço, se fornecido
    if (data.address || data.city || data.state || data.postalCode || data.country || data.addressType) {
      try {
        // Buscando o endereço do usuário
        const userAddress = await prisma.user.findUnique({
          where: { id },
          include: {
            addresses: true,  // Incluindo a relação de endereços
          },
        });

        if (userAddress && userAddress.addresses.length > 0) {
          // Atualizando o primeiro endereço
          await prisma.address.updateMany({
            where: { userId: id },  // Usando o id do primeiro endereço
            data: {
              address: data.address,
              city: data.city,
              state: data.state,
              postalCode: data.postalCode,
              country: data.country,
              type: data.addressType
            },
          });
        } else {
          // Se o usuário não tem um endereço, você pode adicionar um novo
          await prisma.address.create({
            data: {
              userId: id,
              address: data.address || '',
              city: data.city || '',
              state: data.state || '',
              postalCode: data.postalCode || '',
              country: data.country || '',
              type: data.addressType || AddressType.SHIPPING, // Valor padrão se não fornecido
            }
          });
        }
      } catch (error) {
        console.error("Erro ao atualizar endereço:", error);
        throw new Error("Erro ao atualizar endereço");
      }
    }

    return user;
  },

  async deleteUser(id: string) {
    try {
      // Deleta os endereços associados ao usuário
      await prisma.address.deleteMany({
        where: { userId: id },
      });

      // Deleta o usuário
      return await prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      throw new Error("Erro ao deletar usuário");
    }
  },

  async validatePassword(plainPassword: string, hashedPassword: string) {
    return await compare(plainPassword, hashedPassword); // Agora compare está corretamente importado
  },
};
