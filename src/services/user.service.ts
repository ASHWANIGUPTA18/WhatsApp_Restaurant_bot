import { prisma } from "../config/prisma.js";

export async function findUserByPhone(phoneNumber: string) {
  return prisma.user.findUnique({ where: { phoneNumber } });
}

export async function createUser(phoneNumber: string) {
  return prisma.user.create({ data: { phoneNumber } });
}

export async function updateUserName(userId: string, name: string) {
  return prisma.user.update({ where: { id: userId }, data: { name } });
}

export async function updateUserLocation(
  userId: string,
  latitude: number,
  longitude: number,
  address: string | null
) {
  return prisma.user.update({
    where: { id: userId },
    data: { latitude, longitude, address },
  });
}
