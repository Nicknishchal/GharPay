import { api } from "./api";
import { User } from "../types";

export const getUsers = async (): Promise<User[]> => {
  const response = await api.get("/users");
  return response.data;
};

export const createUser = async (userData: { name: string; email: string }): Promise<User> => {
  const response = await api.post("/users", userData);
  return response.data;
};
