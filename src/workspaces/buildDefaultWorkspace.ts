import { EverythingAsCodeOIWorkspace } from '@o-industrial/common/eac';

import { loadEaCActuators } from '../../configs/eac-actuators.config.ts';

export type BuildDefaultWorkspaceOptions = {
  description?: string;
  includeActuators?: boolean;
  includePacks?: boolean;
  name?: string;
};

/**
 * Build the baseline EaC payload used when provisioning a fresh workspace.
 * Ensures actuators and packs mirror the initial sign-up experience.
 */
export function buildDefaultWorkspace(
  options: BuildDefaultWorkspaceOptions = {},
): EverythingAsCodeOIWorkspace {
  const {
    name = 'hello-azi',
    description = 'Getting started with Open Industrial and Azi.',
    includeActuators = true,
    includePacks = true,
  } = options;

  const workspace: EverythingAsCodeOIWorkspace = {
    Details: {
      Name: name,
      Description: description,
    },
    Clouds: {},
  };

  if (includeActuators) {
    workspace.Actuators = loadEaCActuators();
  }

  if (includePacks) {
    workspace.Packs = {
      OICore: {
        Details: {
          Path: '@o-industrial/oi-core-pack',
        },
      },
    };
  }

  return workspace;
}
