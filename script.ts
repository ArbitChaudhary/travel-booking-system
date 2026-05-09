import { prisma } from "./lib/prisma";

async function main() {
  const user = await prisma.user.create({
    data: {
      name: "Alice",
      email: "alice@example.com",
      password: "Password",
    },
  });
  console.log("User created:", user);
  const allUser = await prisma.user.findMany();
  console.log("All users:", allUser);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
