import { useEffect, useMemo, useState } from 'preact/hooks';
import { EaCRuntimeHandlerSet } from '@fathym/eac/runtime/pipelines';
import { PageProps } from '@fathym/eac-applications/preact';
import { OpenIndustrialAPIClient } from '@o-industrial/common/api';
import { NodeScopeTypes, WorkspaceManager } from '@o-industrial/common/flow';
import { AppFrameBar, BreadcrumbBar } from '@o-industrial/atomic/molecules';
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
import {
  createWorkspaceAppMenu,
  getWorkspaceRuntimeMenus,
} from '@o-industrial/oi-core-pack/runtime/workspace-app-menu';
import { marked } from 'npm:marked@15.0.1';
import { EverythingAsCodeOIWorkspace } from '@o-industrial/common/eac';
import { IoCContainer } from '@fathym/ioc';
import { EverythingAsCode } from '@fathym/eac';
import { EaCUserLicense, EverythingAsCodeLicensing } from '@fathym/eac-licensing';
import type { OpenIndustrialWebState } from '@o-industrial/common/runtimes';
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
      DeployAccessRight: Deno.env.get('DEPLOY_ACCESS_RIGHT_LOOKUP') || 'Workspace.Deploy',
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
    [],
  );

  const [workspaceMgr, setWorkspaceMgr] = useState<WorkspaceManager | null>(
    null,
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

        ioc.Register(OpenIndustrialAPIClient, () => oiSvc, {
          Type: ioc.Symbol('OpenIndustrialAPIClient'),
        });

        const pack = await OICore.Build(ioc, accessRights);

        const persistedScope = WorkspaceManager.ResolvePersistedScope(
          initialEaC,
          Username,
        );
        const initialScope: NodeScopeTypes = persistedScope?.Scope ?? 'workspace';
        const initialScopeLookup = persistedScope?.Lookup;

        const mgr = new WorkspaceManager(
          initialEaC,
          Username,
          oiLicense,
          oiSvc,
          // { surface: [], workspace: [] },
          pack,
          initialScope,
          initialScopeLookup,
          aziUrl,
          aziWarmQueryUrl,
          undefined,
          accessRights,
          oiApiToken,
        );

        setWorkspaceMgr(mgr);
        console.log('🔌 Capabilities loaded and WorkspaceManager initialized');
      } catch (err) {
        console.error('❌ Failed to load capabilities pack', err);
      }
    })();
  }, []);

  if (!workspaceMgr) return <div>Loading workspace...</div>;

  const { profile } = workspaceMgr.UseAccountProfile();
  console.log("KBTEST: workspace " + JSON.stringify(profile));
  const userFirstName = useMemo(() => {
    const name = profile.Name?.trim();
    if (name) {
      const [first] = name.split(/\s+/);
      if (first) return first;
    }
    const username = profile.Username?.trim();
    return username ?? '';
  }, [profile.Name, profile.Username]);

  const aziExtraInputs = useMemo(
    () => ({
      UserName: profile.Name,
      UserUsername: profile.Username,
      UserFirstName: userFirstName,
      UserProfile: {
        Name: profile.Name,
        Username: profile.Username,
        FirstName: userFirstName,
      },
    }),
    [profile.Name, profile.Username, userFirstName],
  );

  const pathParts = workspaceMgr.UseBreadcrumb();

  const commitStore = workspaceMgr.UseCommits();
  const [showCommitPanel, setShowCommitPanel] = useState(false);

  useEffect(() => {
    commitStore.load().catch((err) => {
      console.warn('[WorkspacePage] Failed to load commit statuses', err);
    });
  }, [commitStore]);

  const eac:
    & EverythingAsCode
    & EverythingAsCodeLicensing
    & EverythingAsCodeClouds = ParentEaC;

  const runtimeMenus = getWorkspaceRuntimeMenus(eac);

  const { handleMenu, modals, showSimLib, showAccProf, showLicense } = createWorkspaceAppMenu(
    workspaceMgr,
    eac,
  );

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
          commitStore={commitStore}
          isDeploying={history.isDeploying}
          onMenuOption={handleMenu}
          onActivateClick={onActivateClick}
          onCommitClick={() => setShowCommitPanel((prev) => !prev)}
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
          extraInputs={aziExtraInputs}
        />
      }
      breadcrumb={
        <BreadcrumbBar
          pathParts={pathParts}
          // onSettingsClick={() => setShowWorkspaceSettings(true)}
        />
      }
      commitStatus={showCommitPanel
        ? (
          <CommitStatusPanel
            store={commitStore}
            onClose={() => setShowCommitPanel(false)}
          />
        )
        : undefined}
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
