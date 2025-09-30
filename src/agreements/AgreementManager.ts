import { merge } from '@fathym/common';
import { AgreementData } from '@o-industrial/common/atomic/organisms';
import { IoCContainer } from '@fathym/ioc';
import { saveWithRetry } from '../utils/saveWithRetry.ts';
import { fromFileUrl, join } from '@std/path';

type AgreementVersionCacheEntry = {
  version: string;
  mtimeMs: number | null;
  size: number;
};

export class AgreementManager {
  static Definitions = [
    {
      key: 'terms-of-service',
      title: 'Terms of Service',
      file: 'tos.pdf',
      abstract:
        'These Terms of Service outline your responsibilities, our service guarantees, and the legal framework under which Open Industrial operates. Please review them carefully to understand your rights and obligations when using the platform.',
    },
    {
      key: 'privacy-policy',
      title: 'Privacy Policy',
      file: 'privacy.pdf',
      abstract:
        'This Privacy Policy describes how Open Industrial collects, uses, and protects your personal data. We value your trust and are committed to safeguarding your information responsibly and transparently.',
    },
  ];

  static RootUrl = '/assets/agreements';

  private static versionCache = new Map<string, AgreementVersionCacheEntry>();

  constructor(
    protected ioc: IoCContainer,
    protected oiKvLookup: string = 'oi',
  ) {}

  async LoadAgreements(): Promise<AgreementData[]> {
    const agreementsDir = AgreementManager.resolveAgreementsDir();

    const agreements = await Promise.all(
      AgreementManager.Definitions.map(async (def) => {
        const filePath = join(agreementsDir, def.file);

        try {
          const stat = await Deno.stat(filePath);
          const version = await AgreementManager.getAgreementVersion(
            filePath,
            stat,
          );

          return {
            key: def.key,
            title: def.title,
            abstract: def.abstract,
            documentLink: `${AgreementManager.RootUrl}/${def.file}`,
            version,
          } as AgreementData;
        } catch (err) {
          console.warn(
            `AgreementManager: Missing or unreadable file: ${def.file}`,
          );
          console.error(err);
          return null;
        }
      }),
    );

    return agreements.filter((a): a is AgreementData => Boolean(a));
  }

  async LoadUserAccepted(username: string): Promise<Record<string, string>> {
    if (!username) {
      throw new Error('LoadUserAccepted: Username is required.');
    }

    const kv = await this.ioc.Resolve(Deno.Kv, this.oiKvLookup);

    const key = ['User', username, 'Agreements'];

    const accepted = await kv.get<Record<string, string>>(key);

    return accepted?.value ?? {};
  }

  async SaveUserAccepted(
    username: string,
    agreedKeys: string[],
  ): Promise<void> {
    if (!username) {
      throw new Error('SaveUserAccepted: Username is required.');
    }

    await saveWithRetry(async () => {
      const kv = await this.ioc.Resolve(Deno.Kv, this.oiKvLookup);
      const key = ['User', username, 'Agreements'];

      const currentEntry = await kv.get<Record<string, string>>(key);
      const currentAccepted = currentEntry?.value ?? {};

      const allDefinitions = await this.LoadAgreements();

      const incomingAccepted = Object.fromEntries(
        agreedKeys
          .map((k) => {
            const def = allDefinitions.find((d) => d.key === k);
            return def ? [k, def.version] : null;
          })
          .filter((e): e is [string, string] => e !== null),
      );

      const merged = merge(currentAccepted, incomingAccepted);

      const res = await kv
        .atomic()
        .check(currentEntry)
        .set(key, merged)
        .commit();

      if (!res.ok) {
        throw new Error(
          'SaveUserAccepted: Concurrent update detected, please retry.',
        );
      }
    });
  }

  AgreementsOutOfDate(
    agreements: AgreementData[],
    userAccepted: Record<string, string>,
  ): boolean {
    return agreements.some((agreement) => {
      const acceptedVersion = userAccepted[agreement.key];
      return !acceptedVersion || acceptedVersion !== agreement.version;
    });
  }

  private static resolveAgreementsDir(): string {
    const localFilesRoot = Deno.env.get('LOCAL_FILES_ROOT') ?? '';
    const resolved = import.meta.resolve(
      `${localFilesRoot}../../apps/assets/agreements/`,
    );

    return fromFileUrl(new URL(resolved));
  }

  private static async getAgreementVersion(
    filePath: string,
    stat: Deno.FileInfo,
  ): Promise<string> {
    const cacheEntry = AgreementManager.versionCache.get(filePath);
    const mtimeMs = stat.mtime?.getTime() ?? null;
    const size = stat.size ?? 0;

    if (
      cacheEntry &&
      cacheEntry.mtimeMs === mtimeMs &&
      cacheEntry.size === size
    ) {
      return cacheEntry.version;
    }

    const version = await AgreementManager.hashFile(filePath);

    AgreementManager.versionCache.set(filePath, {
      version,
      mtimeMs,
      size,
    });

    return version;
  }

  private static async hashFile(filePath: string): Promise<string> {
    const bytes = await Deno.readFile(filePath);
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
}
