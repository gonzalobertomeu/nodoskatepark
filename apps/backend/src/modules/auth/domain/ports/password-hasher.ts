export abstract class PasswordHasher {
  abstract hash(plaintext: string): Promise<string>;
  abstract verify(hash: string, plaintext: string): Promise<boolean>;
}
