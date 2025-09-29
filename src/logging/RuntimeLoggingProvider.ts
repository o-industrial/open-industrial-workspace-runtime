import { EaCApplicationsLoggingProvider } from '@fathym/eac-applications/runtime/logging';

export class RuntimeLoggingProvider extends EaCApplicationsLoggingProvider {
  constructor() {
    const loggingPackages = ['@aaa_bbb_ccc/common', '@aaa_bbb_ccc/www_xxx_yyy_zzz'];

    super(loggingPackages);
  }
}
