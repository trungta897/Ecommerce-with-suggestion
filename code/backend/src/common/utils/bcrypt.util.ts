import * as bcrypt from 'bcrypt';

export class BcryptHelper {
  private static readonly SALT_ROUNDS = 10;

  /**
   * Hashes a plain text password.
   * @param password The plain text password
   * @returns The hashed password
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compares a plain text password with a hashed password.
   * @param password The plain text password
   * @param hash The hashed password
   * @returns True if they match, false otherwise
   */
  static async comparePassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
