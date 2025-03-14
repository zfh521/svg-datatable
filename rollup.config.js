import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [
  {
    input: 'src/svg-datatable.ts',
    output: [
      {
        file: 'dist/svg-datatable.js',
        format: 'cjs',
        sourcemap: true
      },
      {
        file: 'dist/svg-datatable.esm.js',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' })
    ]
  }
];