import bcrypt from "bcryptjs";

export const hashData = async (data: string) => {
  const salt = await bcrypt.genSalt(10);
  const hashedData = await bcrypt.hash(data, salt);
  return hashedData;
};

export const compareHash = async (data: string, hashedData: string) => {
  const isMatch = await bcrypt.compare(data, hashedData);
  return isMatch;
};
