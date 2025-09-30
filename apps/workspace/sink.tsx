import { EaCRuntimeHandlerSet } from '@fathym/eac/runtime/pipelines';
import { PageProps } from '@fathym/eac-applications/preact';
import {
  CompositeSchemaIcon,
  DeviceIcon,
  EmptyIcon,
  ImpulseIcon,
  ReferenceSchemaIcon,
  SchemaIcon,
  SignalIcon,
  SurfaceIcon,
  TriggerMatchIcon,
} from '@o-industrial/common/atomic/icons';
import { IntentTypes } from '@o-industrial/common/types';
import { Action, ActionStyleTypes, LineSparkSVG } from '@o-industrial/common/atomic/atoms';
import { OpenIndustrialWebState } from '@o-industrial/common/runtimes';

// deno-lint-ignore ban-types
type IndexPageData = {};

export const handler: EaCRuntimeHandlerSet<
  OpenIndustrialWebState,
  IndexPageData
> = {
  GET: (_req, ctx) => {
    return ctx.Render({});
  },
};

export default function DashboardIndex({}: PageProps<IndexPageData>) {
  return (
    <>
      <div class='py-16 px-4 bg-neutral-500/75'>
        <div class='mx-auto block w-[350px] text-center'>
          <h1 class='text-4xl'>Dashboard</h1>

          <div class='flex flex-row py-8'>{/* <Counter /> */}</div>
        </div>
      </div>

      <div class='p-4'>
        <div class='space-y-8'>
          <h1 class='text-2xl font-bold mb-6'>Node Type Icons</h1>

          <div class='flex flex-wrap gap-8'>
            <div class='flex flex-col items-center space-y-2'>
              <DeviceIcon class='w-6 h-6 text-neon-pink-400' />
              <span class='text-sm font-semibold'>Device</span>
            </div>

            <div class='flex flex-col items-center space-y-2'>
              <ImpulseIcon class='w-6 h-6 text-neon-pink-400' />
              <span class='text-sm font-semibold'>Impulse</span>
            </div>

            <div class='flex flex-col items-center space-y-2'>
              <SchemaIcon class='w-6 h-6 text-neon-pink-400' />
              <span class='text-sm font-semibold'>Schema</span>
            </div>

            <div class='flex flex-col items-center space-y-2'>
              <CompositeSchemaIcon class='w-6 h-6 text-neon-pink-400' />
              <span class='text-sm font-semibold'>Composite Schema</span>
            </div>

            <div class='flex flex-col items-center space-y-2'>
              <ReferenceSchemaIcon class='w-6 h-6 text-neon-pink-400' />
              <span class='text-sm font-semibold'>Reference Schema</span>
            </div>

            <div class='flex flex-col items-center space-y-2'>
              <SignalIcon class='w-6 h-6 text-neon-pink-400' />
              <span class='text-sm font-semibold'>Signal</span>
            </div>

            <div class='flex flex-col items-center space-y-2'>
              <SurfaceIcon class='w-6 h-6 text-neon-pink-400' />
              <span class='text-sm font-semibold'>Surface</span>
            </div>

            <div class='flex flex-col items-center space-y-2'>
              <TriggerMatchIcon class='w-6 h-6 text-neon-pink-400' />
              <span class='text-sm font-semibold'>Trigger Match</span>
            </div>

            <div class='flex flex-col items-center space-y-2'>
              <EmptyIcon class='w-6 h-6 text-neon-pink-400' />
              <span class='text-sm font-semibold'>Empty</span>
            </div>
          </div>
        </div>

        <div class='space-y-8'>
          <h1 class='text-2xl font-bold mb-6'>Action Button Variants</h1>

          <div class='flex flex-wrap gap-8'>
            <div class='flex flex-col items-center space-y-2'>
              <h2 class='text-sm font-semibold'>Primary Solid</h2>
              <Action
                styleType={ActionStyleTypes.Solid | ActionStyleTypes.Rounded}
                intentType={IntentTypes.Primary}
              >
                Launch
              </Action>
            </div>

            <div class='flex flex-col items-center space-y-2'>
              <h2 class='text-sm font-semibold'>Secondary Outline</h2>
              <Action
                styleType={ActionStyleTypes.Outline | ActionStyleTypes.Rounded}
                intentType={IntentTypes.Secondary}
                href='#'
              >
                Read Terms
              </Action>
            </div>

            <div class='flex flex-col items-center space-y-2'>
              <h2 class='text-sm font-semibold'>Tertiary Outline</h2>
              <Action
                styleType={ActionStyleTypes.Solid | ActionStyleTypes.Rounded}
                intentType={IntentTypes.Tertiary}
                href='#'
              >
                Read Terms
              </Action>
            </div>

            <div class='flex flex-col items-center space-y-2'>
              <h2 class='text-sm font-semibold'>Icon Primary</h2>
              <Action
                styleType={ActionStyleTypes.Icon | ActionStyleTypes.Rounded}
                intentType={IntentTypes.Primary}
              >
                <SignalIcon class='w-5 h-5' />
              </Action>
            </div>

            <div class='flex flex-col items-center space-y-2'>
              <h2 class='text-sm font-semibold'>Info Link</h2>
              <Action
                styleType={ActionStyleTypes.Link}
                intentType={IntentTypes.Info}
                href='#'
              >
                Learn More
              </Action>
            </div>

            <div class='flex flex-col items-center space-y-2'>
              <h2 class='text-sm font-semibold'>Solid Warning</h2>
              <Action
                styleType={ActionStyleTypes.Solid | ActionStyleTypes.Rounded}
                intentType={IntentTypes.Warning}
              >
                Retry Warning
              </Action>
            </div>

            <div class='flex flex-col items-center space-y-2'>
              <h2 class='text-sm font-semibold'>Outline Warning</h2>
              <Action
                styleType={ActionStyleTypes.Outline | ActionStyleTypes.Rounded}
                intentType={IntentTypes.Warning}
              >
                Warning Outline
              </Action>
            </div>

            <div class='flex flex-col items-center space-y-2'>
              <h2 class='text-sm font-semibold'>Solid Info</h2>
              <Action
                styleType={ActionStyleTypes.Solid | ActionStyleTypes.Rounded}
                intentType={IntentTypes.Info}
              >
                Info Action
              </Action>
            </div>

            <div class='flex flex-col items-center space-y-2'>
              <h2 class='text-sm font-semibold'>Outline Info</h2>
              <Action
                styleType={ActionStyleTypes.Outline | ActionStyleTypes.Rounded}
                intentType={IntentTypes.Info}
              >
                Info Outline
              </Action>
            </div>

            <div class='flex flex-col items-center space-y-2'>
              <h2 class='text-sm font-semibold'>Solid Error</h2>
              <Action
                styleType={ActionStyleTypes.Solid | ActionStyleTypes.Rounded}
                intentType={IntentTypes.Error}
              >
                Delete
              </Action>
            </div>

            <div class='flex flex-col items-center space-y-2'>
              <h2 class='text-sm font-semibold'>Outline Error</h2>
              <Action
                styleType={ActionStyleTypes.Outline | ActionStyleTypes.Rounded}
                intentType={IntentTypes.Error}
              >
                Danger Outline
              </Action>
            </div>

            <div class='flex flex-col items-center space-y-2'>
              <h2 class='text-sm font-semibold'>Disabled Primary</h2>
              <Action
                styleType={ActionStyleTypes.Solid | ActionStyleTypes.Rounded}
                intentType={IntentTypes.Primary}
                disabled
              >
                Disabled Primary
              </Action>
            </div>

            <div class='flex flex-col items-center space-y-2'>
              <h2 class='text-sm font-semibold'>Disabled Link</h2>
              <Action
                styleType={ActionStyleTypes.Link}
                intentType={IntentTypes.Info}
                href='#'
                disabled
              >
                Disabled Link
              </Action>
            </div>
          </div>
        </div>

        <div class='space-y-8 mt-16'>
          <h1 class='text-2xl font-bold mb-6'>LineSparkSVG Demo Grid</h1>

          <div class='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8'>
            {/* SMOOTH PRIMARY */}
            <div class='bg-neutral-800 p-4 rounded-md shadow-md'>
              <h2 class='text-sm font-medium mb-2 text-white'>
                Smooth – Primary
              </h2>
              <LineSparkSVG
                lines={[
                  {
                    values: [1, 2.5, 1.8, 3, 2.2, 2.8, 3.2],
                    intent: IntentTypes.Primary,
                    mode: 'smooth',
                  },
                ]}
              />
            </div>

            {/* LINEAR INFO */}
            <div class='bg-neutral-800 p-4 rounded-md shadow-md'>
              <h2 class='text-sm font-medium mb-2 text-white'>Linear – Info</h2>
              <LineSparkSVG
                lines={[
                  {
                    values: [2, 2.5, 2, 2.5, 3, 3.2],
                    intent: IntentTypes.Info,
                    mode: 'linear',
                  },
                ]}
              />
            </div>

            {/* STEP – ERROR */}
            <div class='bg-neutral-800 p-4 rounded-md shadow-md'>
              <h2 class='text-sm font-medium mb-2 text-white'>Step – Error</h2>
              <LineSparkSVG
                lines={[
                  {
                    values: [2, 1.5, 1.5, 2.2, 3, 2],
                    intent: IntentTypes.Error,
                    mode: 'step',
                  },
                ]}
              />
            </div>

            {/* DUAL LINES – INFO + WARNING */}
            <div class='bg-neutral-800 p-4 rounded-md shadow-md'>
              <h2 class='text-sm font-medium mb-2 text-white'>
                Multi – Info + Warning
              </h2>
              <LineSparkSVG
                lines={[
                  {
                    values: [1, 1.5, 1.2, 1.8, 2],
                    intent: IntentTypes.Info,
                    mode: 'smooth',
                  },
                  {
                    values: [2, 2.2, 2.1, 2.5, 3],
                    intent: IntentTypes.Warning,
                    mode: 'smooth',
                  },
                ]}
              />
            </div>

            {/* NO ANIMATION */}
            <div class='bg-neutral-800 p-4 rounded-md shadow-md'>
              <h2 class='text-sm font-medium mb-2 text-white'>
                Linear – Static
              </h2>
              <LineSparkSVG
                lines={[
                  {
                    values: [1, 2, 1.5, 2.2],
                    intent: IntentTypes.Secondary,
                    mode: 'linear',
                  },
                ]}
                animate={false}
              />
            </div>

            {/* TERTIARY SMOOTH THICKER */}
            <div class='bg-neutral-800 p-4 rounded-md shadow-md'>
              <h2 class='text-sm font-medium mb-2 text-white'>
                Smooth – Thick
              </h2>
              <LineSparkSVG
                lines={[
                  {
                    values: [2, 2.5, 3, 2.5, 2],
                    intent: IntentTypes.Tertiary,
                    mode: 'smooth',
                  },
                ]}
                height={60}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
