export class CurrentUserManager {
  constructor(protected kv: Deno.Kv) {}

  public async GetActiveWorkspace(username: string): Promise<string | undefined> {
    const current = await this.kv.get<string>([
      'User',
      username,
      'Current',
      'WorkspaceLookup',
    ]);

    return current.value ?? undefined;
  }

  public async SetActiveWorkspace(username: string, workspaceLookup: string): Promise<void> {
    await this.kv.set(['User', username, 'Current', 'WorkspaceLookup'], workspaceLookup);
  }
}
