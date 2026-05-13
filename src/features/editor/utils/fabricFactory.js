/**
 * Single entry point for the Fabric.js v6 library.
 *
 * Two import styles coexisted in the codebase before Phase A:
 *   - Named imports (`import { Canvas } from 'fabric'`)
 *   - Namespace imports (`import * as fabric from 'fabric'`)
 *
 * Both load the same module, but two paths through the bundler mean
 * class-identity surprises (`instanceof` against two graphs) and a
 * larger surface for tree-shaking misses. From Phase A onward, every
 * file imports from this factory.
 *
 * Usage:
 *   import { Canvas, Rect } from '@/features/editor/utils/fabricFactory';
 *   import { fabric } from '@/features/editor/utils/fabricFactory';
 *   import fabric from '@/features/editor/utils/fabricFactory';
 */
import * as fabricNs from 'fabric';

export * from 'fabric';

export const fabric = fabricNs;

export default fabricNs;
