import { EaCAtomicIconsProcessor } from '@fathym/atomic-icons';
import { FathymAtomicIconsPlugin } from '@fathym/atomic-icons/plugin';
import { DefaultWorkspaceProcessorHandlerResolver } from './DefaultWorkspaceProcessorHandlerResolver.ts';
import { IoCContainer } from '@fathym/ioc';
import { EaCRuntimeConfig, EaCRuntimePluginConfig } from '@fathym/eac/runtime/config';
import { EaCRuntimePlugin } from '@fathym/eac/runtime/plugins';
import { EverythingAsCode } from '@fathym/eac';
import { EverythingAsCodeApplications } from '@fathym/eac-applications';
import {
  EaCDFSProcessor,
  EaCOAuthProcessor,
  EaCPreactAppProcessor,
  EaCTailwindProcessor,
} from '@fathym/eac-applications/processors';
import { EaCDenoKVDetails, EverythingAsCodeDenoKV } from '@fathym/eac-deno-kv';
import {
  EaCBaseHREFModifierDetails,
  EaCGoogleTagMgrModifierDetails,
  EaCKeepAliveModifierDetails,
  EaCMSAppInsightsModifierDetails,
  EaCOAuthModifierDetails,
} from '@fathym/eac-applications/modifiers';
import {
  EaCJSRDistributedFileSystemDetails,
  EaCLocalDistributedFileSystemDetails,
} from '@fathym/eac/dfs';
import { EaCAzureADB2CProviderDetails, EaCAzureADProviderDetails } from '@fathym/eac-identity';
import {
  OpenIndustrialLicensingPlugin,
  OpenIndustrialMSALPlugin,
  resolveAccessRights,
} from '@o-industrial/common/runtimes';
import { EaCMSALProcessor } from '@fathym/msal';

export default class RuntimePlugin implements EaCRuntimePlugin {
  constructor() {}

  public Setup(config: EaCRuntimeConfig) {
    const pluginConfig: EaCRuntimePluginConfig<
      EverythingAsCode & EverythingAsCodeApplications & EverythingAsCodeDenoKV
    > = {
      Name: RuntimePlugin.name,
      Plugins: [
        new FathymAtomicIconsPlugin(),
        new OpenIndustrialLicensingPlugin(),
        new OpenIndustrialMSALPlugin(),
      ],
      IoC: new IoCContainer(),
      EaC: {
        Projects: {
          core: {
            Details: {
              Name: 'Open Industrial Workspace Runtime',
              Description: 'Dedicated runtime hosting Open Industrial workspace experiences.',
              Priority: 100,
            },
            ResolverConfigs: {
              localhost: {
                Hostname: 'localhost',
                Port: config.Servers?.[0]?.port || 8000,
              },
              '127.0.0.1': {
                Hostname: '127.0.0.1',
                Port: config.Servers?.[0]?.port || 8000,
              },
              'host.docker.internal': {
                Hostname: 'host.docker.internal',
                Port: config.Servers?.[0]?.port || 8000,
              },
              'open-industrial-workspace-runtime.azurewebsites.net': {
                Hostname: 'open-industrial-workspace-runtime.azurewebsites.net',
              },
            },
            ModifierResolvers: {
              googleTagMgr: {
                Priority: 5000,
              },
              keepAlive: {
                Priority: 5000,
              },
              msAppInsights: {
                Priority: 5000,
              },
              oauth: {
                Priority: 10000,
              },
            },
            ApplicationResolvers: {
              assets: {
                PathPattern: '/assets*',
                Priority: 500,
              },
              atomicIcons: {
                PathPattern: '/icons*',
                Priority: 500,
              },
              licensingApi: {
                PathPattern: '/api/o-industrial/licensing/*',
                Priority: 600,
                IsPrivate: true,
              },
              msal: {
                PathPattern: '/azure/oauth/*',
                Priority: 600,
              },
              oauth: {
                PathPattern: '/oauth/*',
                Priority: 500,
              },
              tailwind: {
                PathPattern: '/tailwind*',
                Priority: 500,
              },
              workspace: {
                PathPattern: '*',
                Priority: 100,
                IsPrivate: true,
                IsTriggerSignIn: true,
              },
            },
          },
        },
        Applications: {
          assets: {
            Details: {
              Name: 'Assets',
              Description: 'Static assets supporting the workspace runtime.',
            },
            ModifierResolvers: {},
            Processor: {
              Type: 'DFS',
              DFSLookup: 'local:apps/assets',
              CacheControl: {
                'text/html': `private, max-age=${60 * 5}`,
                'image/': `public, max-age=${60 * 60 * 24 * 365}, immutable`,
                'application/javascript': `public, max-age=${60 * 60 * 24 * 365}, immutable`,
                'application/typescript': `public, max-age=${60 * 60 * 24 * 365}, immutable`,
                'text/css': `public, max-age=${60 * 60 * 24 * 365}, immutable`,
              },
            } as EaCDFSProcessor,
          },
          atomicIcons: {
            Details: {
              Name: 'Atomic Icons',
              Description: 'Iconset assets leveraged across workspace surfaces.',
            },
            ModifierResolvers: {},
            Processor: {
              Type: 'AtomicIcons',
              Config: './configs/atomic-icons.config.json',
            } as EaCAtomicIconsProcessor,
          },
          msal: {
            Details: {
              Name: 'Azure MSAL',
              Description: 'Azure Active Directory sign-in callbacks.',
            },
            Processor: {
              Type: 'MSAL',
              Config: {
                MSALSignInOptions: {
                  Scopes: ['https://management.azure.com/user_impersonation'],
                  RedirectURI: '/azure/oauth/callback',
                  SuccessRedirect: '/',
                },
                MSALSignOutOptions: {
                  ClearSession: false,
                  PostLogoutRedirectUri: '/',
                },
              },
              ProviderLookup: 'azure',
            } as EaCMSALProcessor,
          },
          oauth: {
            Details: {
              Name: 'OAuth Site',
              Description: 'ADB2C sign-in and callback endpoints.',
            },
            Processor: {
              Type: 'OAuth',
              ProviderLookup: 'adb2c',
            } as EaCOAuthProcessor,
          },
          tailwind: {
            Details: {
              Name: 'Tailwind Styles',
              Description: 'Tailwind build feeding workspace layout styles.',
            },
            Processor: {
              Type: 'Tailwind',
              DFSLookups: ['local:apps/workspace', 'jsr:@o-industrial/atomic'],
              ConfigPath: './tailwind.config.ts',
              StylesTemplatePath: './apps/tailwind/styles.css',
              CacheControl: {
                'text/css': `public, max-age=${60 * 60 * 24 * 365}, immutable`,
              },
            } as EaCTailwindProcessor,
          },
          workspace: {
            Details: {
              Name: 'Workspace Site',
              Description: 'Tenanted workspace dashboards and tooling.',
            },
            ModifierResolvers: {
              baseHref: {
                Priority: 10000,
              },
            },
            Processor: {
              Type: 'PreactApp',
              AppDFSLookup: 'local:apps/workspace',
              ComponentDFSLookups: [
                ['local:apps/workspace', ['tsx']],
                ['jsr:@o-industrial/atomic', ['tsx']],
              ],
            } as EaCPreactAppProcessor,
          },
        },
        DenoKVs: {
          oauth: {
            Details: {
              Type: 'DenoKV',
              Name: 'OAuth Session Store',
              Description: 'Deno KV backing MSAL and ADB2C session state.',
              DenoKVPath: Deno.env.get('OAUTH_DENO_KV_PATH') || undefined,
            } as EaCDenoKVDetails,
          },
          oi: {
            Details: {
              Type: 'DenoKV',
              Name: 'Open Industrial',
              Description: 'Workspace cache for the workspace runtime.',
              DenoKVPath: Deno.env.get('OPEN_INDUSTRIAL_DENO_KV_PATH') || undefined,
            } as EaCDenoKVDetails,
          },
        },
        DFSs: {
          'local:apps/assets': {
            Details: {
              Type: 'Local',
              FileRoot: './apps/assets/',
            } as EaCLocalDistributedFileSystemDetails,
          },
          'local:apps/tailwind': {
            Details: {
              Type: 'Local',
              FileRoot: './apps/tailwind/',
            } as EaCLocalDistributedFileSystemDetails,
          },
          'local:apps/workspace': {
            Details: {
              Type: 'Local',
              FileRoot: './apps/workspace/',
              DefaultFile: 'index.tsx',
              Extensions: ['tsx'],
            } as EaCLocalDistributedFileSystemDetails,
          },
          'jsr:@o-industrial/atomic': {
            Details: {
              Type: 'JSR',
              Package: '@o-industrial/atomic',
              Version: '',
              Extensions: ['tsx'],
            } as EaCJSRDistributedFileSystemDetails,
          },
        },
        Modifiers: {
          baseHref: {
            Details: {
              Type: 'BaseHREF',
              Name: 'Base HREF',
              Description: 'Adjusts the base HREF of a response based on configuration.',
            } as EaCBaseHREFModifierDetails,
          },
          googleTagMgr: {
            Details: {
              Type: 'GoogleTagMgr',
              Name: 'Google Tag Manager',
              Description: 'Adds Google Tag code for telemetry.',
              GoogleID: Deno.env.get('GOOGLE_TAGS_ID')!,
            } as EaCGoogleTagMgrModifierDetails,
          },
          keepAlive: {
            Details: {
              Type: 'KeepAlive',
              Name: 'Deno KV Cache',
              Description: 'Lightweight cache stored inside Deno KV.',
              KeepAlivePath: '/_eac/alive',
            } as EaCKeepAliveModifierDetails,
          },
          msAppInsights: {
            Details: {
              Type: 'MSAppInsights',
              Name: 'Microsoft Application Insights',
              Description: 'Adds Microsoft Azure Application Insights instrumentation.',
              InstrumentationKey: Deno.env.get(
                'APP_INSIGHTS_INSTRUMENTATION_KEY',
              )!,
            } as EaCMSAppInsightsModifierDetails,
          },
          oauth: {
            Details: {
              Type: 'OAuth',
              Name: 'OAuth',
              Description: 'Restricts user access for secured applications.',
              ProviderLookup: 'adb2c',
              SignInPath: '/oauth/signin',
            } as EaCOAuthModifierDetails,
          },
        },
        Providers: {
          adb2c: {
            DatabaseLookup: 'oauth',
            Details: {
              Name: 'Azure ADB2C OAuth Provider',
              Description: 'Connects to the Azure ADB2C identity provider.',
              ClientID: Deno.env.get('AZURE_ADB2C_CLIENT_ID')!,
              ClientSecret: Deno.env.get('AZURE_ADB2C_CLIENT_SECRET')!,
              Scopes: ['openid', Deno.env.get('AZURE_ADB2C_CLIENT_ID')!],
              Domain: Deno.env.get('AZURE_ADB2C_DOMAIN')!,
              PolicyName: Deno.env.get('AZURE_ADB2C_POLICY')!,
              TenantID: Deno.env.get('AZURE_ADB2C_TENANT_ID')!,
              IsPrimary: true,
            } as EaCAzureADB2CProviderDetails,
          },
          azure: {
            DatabaseLookup: 'oauth',
            Details: {
              Name: 'Azure OAuth Provider',
              Description: 'Connects the runtime to Azure Active Directory.',
              ClientID: Deno.env.get('AZURE_AD_CLIENT_ID')!,
              ClientSecret: Deno.env.get('AZURE_AD_CLIENT_SECRET')!,
              Scopes: ['openid'],
              TenantID: Deno.env.get('AZURE_AD_TENANT_ID')!,
            } as EaCAzureADProviderDetails,
          },
        },
        $GlobalOptions: {
          DFSs: {
            PreventWorkers: true,
          },
        },
      },
    };

    pluginConfig.IoC!.Register(DefaultWorkspaceProcessorHandlerResolver, {
      Type: pluginConfig.IoC!.Symbol('ProcessorHandlerResolver'),
    });

    pluginConfig.IoC!.Register(() => resolveAccessRights, {
      Type: pluginConfig.IoC!.Symbol('AccessRightsResolver'),
    });

    return Promise.resolve(pluginConfig);
  }
}
