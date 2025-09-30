import { EaCModuleActuators } from '@fathym/eac';

export const loadEaCActuators: () => EaCModuleActuators = () => {
  const base = Deno.env.get('OPEN_INDUSTRIAL_ACTUATORS_ROOT');

  return {
    $Force: true,
    Clouds: {
      APIPath: new URL('./steward/clouds/azure', base),
      Order: 100,
    },
    DataConnections: {
      APIPath: new URL('./actuators/data-connections', base),
      Order: 300,
    },
    Licenses: {
      APIPath: new URL('./licenses', base),
      Order: 200,
    },
    Simulators: {
      APIPath: new URL('./actuators/simulators', base),
      Order: 300,
    },
    // GitHubApps: {
    //   APIPath: new URL('./github-apps', base),
    //   Order: 100,
    // },
  } as unknown as EaCModuleActuators;
};
