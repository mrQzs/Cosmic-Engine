import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PluginList = any[];

export const remarkPlugins: PluginList = [remarkGfm, remarkMath];

export const rehypePlugins: PluginList = [rehypeKatex, [rehypeHighlight, { detect: false }]];
