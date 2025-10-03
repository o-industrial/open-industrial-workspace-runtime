import { useEffect, useMemo, useState } from 'preact/hooks';
import { EaCRuntimeHandlerSet } from '@fathym/eac/runtime/pipelines';
import { PageProps } from '@fathym/eac-applications/preact';
import { OpenIndustrialAPIClient } from '@o-industrial/common/api';
import { WorkspaceManager } from '@o-industrial/common/flow';
import {
  AppFrameBar,
  BreadcrumbBar,
  MenuRoot,
} from '@o-industrial/atomic/molecules';
import {
  AziPanel,
  CommitStatusPanel,
  FlowPanel,
  InspectorPanel,
  StreamPanel,
  TimelinePanel,
} from '@o-industrial/atomic/organisms';
import { RuntimeWorkspaceDashboardTemplate } from '@o-industrial/atomic/templates';
import OICore from '@o-industrial/oi-core-pack';
import { marked } from 'npm:marked@15.0.1';
import { EverythingAsCodeOIWorkspace } from '@o-industrial/common/eac';
import { IoCContainer } from '@fathym/ioc';
import { EverythingAsCode } from '@fathym/eac';
import {
  EaCUserLicense,
  EverythingAsCodeLicensing,
} from '@fathym/eac-licensing';
import { OpenIndustrialWebState } from '@o-industrial/common/runtimes';
import { EaCApplicationsRuntimeContext } from '@fathym/eac-applications/runtime';
import { EverythingAsCodeClouds } from '@fathym/eac-azure';

export const IsIsland = true;

type WorkspacePageData = {
  ParentEaC: EverythingAsCode & EverythingAsCodeLicensing;
  OIAPIRoot: string;
  OIAPIToken: string;
  OILicense?: EaCUserLicense;
  AccessRights?: string[];
  DeployAccessRight?: string;
  Username: string;
  Workspace: EverythingAsCodeOIWorkspace;
  AziCircuitUrl: string;
  AziWarmQueryCircuitUrl: string;
};

export const handler: EaCRuntimeHandlerSet<
  OpenIndustrialWebState,
  WorkspacePageData
> = {
  GET: (_req, ctx) => {
    const appCtx = ctx as EaCApplicationsRuntimeContext<
      OpenIndustrialWebState,
      WorkspacePageData
    >;

    return ctx.Render({
      ParentEaC: ctx.Runtime.EaC,
      OIAPIRoot: '/api/',
      OIAPIToken: ctx.State.OIJWT,
      OILicense: ctx.State.UserLicenses?.['o-industrial'],
      AccessRights: appCtx.Runtime.AccessRights ?? [],
      DeployAccessRight:
        Deno.env.get('DEPLOY_ACCESS_RIGHT_LOOKUP') || 'Workspace.Deploy',
      Username: ctx.State.Username,
      Workspace: ctx.State.Workspace!,
      AziCircuitUrl: Deno.env.get('AZI_MAIN_CIRCUIT_URL')!,
      AziWarmQueryCircuitUrl: Deno.env.get('AZI_WARM_QUERY_CIRCUIT_URL')!,
    });
  },
};

export default function WorkspacePage({
  Data: {
    Workspace: initialEaC,
    OIAPIRoot: oiApiRoot,
    OIAPIToken: oiApiToken,
    OILicense: oiLicense,
    AccessRights: accessRights,
    DeployAccessRight: deployRightLookup,
    ParentEaC,
    Username,
    AziCircuitUrl: aziUrl,
    AziWarmQueryCircuitUrl: aziWarmQueryUrl,
  },
}: PageProps<WorkspacePageData>) {
  // return <>Running2</>;
  const origin = location?.origin ?? 'https://server.com';
  const root = `${origin}${oiApiRoot}`;
  const oiSvc = useMemo(
    () => new OpenIndustrialAPIClient(new URL(root), oiApiToken),
    []
  );

  const [workspaceMgr, setWorkspaceMgr] = useState<WorkspaceManager | null>(
    null
  );

  // ⏬ Load capabilities pack from dynamic endpoint
  useEffect(() => {
    (async () => {
      try {
        // const capsResp = await oiSvc.Workspaces.LoadCapabilities();

        // const mod = await import(await capsResp.text());

        // const pack = mod.default?.Build?.() ?? mod.Build?.();
        // const capabilities = pack?.Capabilities;

        // if (!capabilities) throw new Error('No capabilities found in loaded pack');

        const ioc = new IoCContainer();

        ioc.Register(OpenIndustrialAPIClient, () => oiSvc);

        const capabilities = (await OICore.Build(ioc)).Capabilities!;

        const mgr = new WorkspaceManager(
          initialEaC,
          Username,
          oiLicense,
          oiSvc,
          // { surface: [], workspace: [] },
          capabilities,
          'workspace',
          aziUrl,
          aziWarmQueryUrl,
          undefined,
          accessRights,
          oiApiToken
        );

        setWorkspaceMgr(mgr);
        console.log('🔌 Capabilities loaded and WorkspaceManager initialized');
      } catch (err) {
        console.error('❌ Failed to load capabilities pack', err);
      }
    })();
  }, []);

  if (!workspaceMgr) return <div>Loading workspace...</div>;

  const pathParts = workspaceMgr.UseBreadcrumb();

  const {
    commits,
    badgeState,
    showCommitPanel,
    toggleCommitPanel,
    selectedCommitId,
    selectCommit,
  } = workspaceMgr.UseCommits();

  const eac: EverythingAsCode &
    EverythingAsCodeLicensing &
    EverythingAsCodeClouds = ParentEaC;

  const { handleMenu, modals, showSimLib, showAccProf, showLicense } =
    workspaceMgr.UseAppMenu(eac);

  // Icons — reuse your existing set; add a couple of lucide fallbacks where needed
  const I = {
    // existing
    save: 'https://api.iconify.design/lucide:save.svg',
    fork: 'https://api.iconify.design/lucide:git-fork.svg',
    archive: 'https://api.iconify.design/lucide:archive.svg',
    export: 'https://api.iconify.design/lucide:download.svg',
    eye: 'https://api.iconify.design/lucide:eye.svg',
    check: 'https://api.iconify.design/lucide:check.svg',
    commit: 'https://api.iconify.design/lucide:git-commit.svg',

    // from your icon map
    settings: 'https://api.iconify.design/lucide:settings.svg',
    users: 'https://api.iconify.design/lucide:users.svg',
    link: 'https://api.iconify.design/mdi:link-variant.svg',
    lock: 'https://api.iconify.design/lucide:lock.svg',
    warmQuery: 'https://api.iconify.design/mdi:sql-query.svg',
    key: 'https://api.iconify.design/lucide:key.svg',
    stack: 'https://api.iconify.design/lucide:layers-3.svg',
    dollar: 'https://api.iconify.design/lucide:dollar-sign.svg',

    // sensible additions (lucide)
    cloud: 'https://api.iconify.design/lucide:cloud.svg',
    cloudAttach: 'https://api.iconify.design/lucide:cloud-upload.svg',
    privateCloud: 'https://api.iconify.design/lucide:server.svg',
    license: 'https://api.iconify.design/lucide:badge-check.svg',
    creditCard: 'https://api.iconify.design/lucide:credit-card.svg',
  } as const;

  const hasWorkspaceCloud =
    !!eac.Clouds?.Workspace?.Details ||
    Object.keys(eac.Clouds || {}).length > 0;

  const runtimeMenus: MenuRoot[] = [
    // // ===== File (unchanged example) =====
    // {
    //   id: 'file',
    //   label: 'File',
    //   items: [
    //     {
    //       type: 'submenu',
    //       id: 'file.new',
    //       label: 'New',
    //       items: [
    //         { type: 'item', id: 'file.new.workspace', label: 'Workspace', iconSrc: I.archive },
    //         { type: 'item', id: 'file.new.surface', label: 'Surface', iconSrc: I.archive },
    //       ],
    //     },
    //     { type: 'item', id: 'file.save', label: 'Save', shortcut: '⌘S', iconSrc: I.save },
    //     { type: 'item', id: 'file.fork', label: 'Fork Workspace', iconSrc: I.fork },
    //     { type: 'separator', id: 'file.sep1' },
    //     {
    //       type: 'submenu',
    //       id: 'file.export',
    //       label: 'Export',
    //       items: [
    //         { type: 'item', id: 'file.export.json', label: 'Export JSON', iconSrc: I.export, payload: { format: 'json' } },
    //         { type: 'item', id: 'file.export.png', label: 'Export PNG', iconSrc: I.export, payload: { format: 'png' } },
    //       ],
    //     },
    //   ],
    // },

    // ===== View (unchanged example) =====
    // {
    //   id: 'view',
    //   label: 'View',
    //   items: [
    //     {
    //       type: 'submenu',
    //       id: 'view.panels',
    //       label: 'Panels',
    //       items: [
    //         {
    //           type: 'item',
    //           id: 'view.toggle.azi',
    //           label: 'Azi',
    //           iconSrc: I.eye,
    //           checked: true,
    //         },
    //         {
    //           type: 'item',
    //           id: 'view.toggle.inspector',
    //           label: 'Inspector',
    //           iconSrc: I.eye,
    //           checked: true,
    //         },
    //         {
    //           type: 'item',
    //           id: 'view.toggle.stream',
    //           label: 'Stream',
    //           iconSrc: I.eye,
    //           checked: true,
    //         },
    //         {
    //           type: 'item',
    //           id: 'view.toggle.timeline',
    //           label: 'Timeline',
    //           iconSrc: I.eye,
    //           checked: true,
    //         },
    //       ],
    //     },
    //     { type: 'item', id: 'view.fullscreen', label: 'Enter Fullscreen' },
    //     { type: 'item', id: 'view.reset', label: 'Reset Layout' },
    //   ],
    // },

    // ===== Workspace =====
    {
      id: 'workspace',
      label: 'Workspace',
      items: [
        {
          type: 'item',
          id: 'workspace.settings',
          label: 'Settings',
          iconSrc: I.settings,
        },
        {
          type: 'item',
          id: 'workspace.team',
          label: 'Team Members',
          iconSrc: I.users,
        },
        {
          type: 'item',
          id: 'workspace.viewAll',
          label: 'View All…',
          iconSrc: I.stack,
          payload: { target: 'workspace-index' },
        },
      ],
    },

    // ===== Environment =====
    {
      id: 'environment',
      label: 'Environment',
      items: [
        {
          type: 'item',
          id: 'env.connections',
          label: 'Cloud Connections',
          iconSrc: I.link,
        },
        ...(hasWorkspaceCloud
          ? [
              {
                type: 'item' as const,
                id: 'env.calz',
                label: 'Manage Private CALZ',
                iconSrc: I.privateCloud,
              },
            ]
          : []),
        // Future: Cloud submenus
        // { type: 'item', id: 'env.secrets', label: 'Manage Secrets', iconSrc: I.lock },
        // {
        //   type: 'submenu',
        //   id: 'env.cloud',
        //   label: 'Cloud',
        //   iconSrc: I.cloud,
        //   items: [
        //     { type: 'item', id: 'env.cloud.attachManaged', label: 'Attach Managed Cloud', iconSrc: I.cloudAttach },
        //     { type: 'item', id: 'env.cloud.addPrivate', label: 'Add Private Cloud', iconSrc: I.privateCloud },
        //   ],
        // },
      ],
    },

    // ===== APIs =====
    {
      id: 'apis',
      label: 'APIs',
      items: [
        {
          type: 'item',
          id: 'apis.apiKeys',
          label: 'API Keys',
          iconSrc: I.key,
        },
        {
          type: 'item',
          id: 'apis.dataSuite',
          label: 'Data API Suite',
          iconSrc: I.stack,
          payload: { section: 'data' },
        },
        {
          type: 'item',
          id: 'apis.warmQuery',
          label: 'Warm Query Management',
          iconSrc: I.warmQuery,
        },
      ],
    },

    // ===== Billing =====
    {
      id: 'billing',
      label: 'Billing',
      items: [
        {
          type: 'item',
          id: 'billing.license',
          label: 'Current License',
          iconSrc: I.license,
        },
        // {
        //   type: 'item',
        //   id: 'billing.details',
        //   label: 'Billing Details',
        //   iconSrc: I.creditCard, /* or I.dollar */
        // },
      ],
    },
  ];

  const history = workspaceMgr.UseHistory();

  // Determine deploy capability based on a specific access right if configured; otherwise fallback to license
  const canDeploy = deployRightLookup
    ? accessRights?.includes(deployRightLookup) ?? false
    : !!oiLicense;

  const onActivateClick = canDeploy ? undefined : () => showLicense();

  const onDeployClick = canDeploy
    ? async () => {
        await history.deploy();
      }
    : undefined;

  return (
    <RuntimeWorkspaceDashboardTemplate
      // commitFlyover
      appBar={
        <AppFrameBar
          hasWorkspaceChanges={history.hasChanges}
          menus={runtimeMenus}
          commitBadgeState={badgeState}
          isDeploying={history.isDeploying}
          onMenuOption={handleMenu}
          onActivateClick={onActivateClick}
          onCommitClick={toggleCommitPanel}
          onDeployClick={onDeployClick}
          onProfileClick={() => showAccProf()}
          // onSettingsClick={() => showWkspSets()}
        />
      }
      azi={
        <AziPanel
          workspaceMgr={workspaceMgr}
          renderMessage={(msg) => marked.parse(msg) as string}
          aziMgr={workspaceMgr.Azi}
        />
      }
      breadcrumb={
        <BreadcrumbBar
          pathParts={pathParts}
          // onSettingsClick={() => setShowWorkspaceSettings(true)}
        />
      }
      commitStatus={
        showCommitPanel ? (
          <CommitStatusPanel
            commits={commits}
            selectedCommitId={selectedCommitId ?? undefined}
            onSelectCommit={selectCommit}
            onClose={toggleCommitPanel}
          />
        ) : undefined
      }
      inspector={<InspectorPanel workspaceMgr={workspaceMgr} />}
      stream={<StreamPanel workspaceMgr={workspaceMgr} />}
      timeline={<TimelinePanel />}
      modals={modals}
    >
      <FlowPanel
        workspaceMgr={workspaceMgr}
        onShowSimulatorLibrary={() => showSimLib()}
      />
    </RuntimeWorkspaceDashboardTemplate>
  );
}
