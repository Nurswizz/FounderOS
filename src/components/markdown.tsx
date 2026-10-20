import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Без typography-плагина: стили для основных элементов Markdown.
const PROSE =
  "space-y-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 " +
  "[&_h1]:text-lg [&_h1]:font-semibold [&_h1]:text-zinc-900 dark:[&_h1]:text-zinc-100 " +
  "[&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-zinc-900 dark:[&_h2]:text-zinc-100 " +
  "[&_h3]:mt-4 [&_h3]:font-medium [&_h3]:text-zinc-900 dark:[&_h3]:text-zinc-100 " +
  "[&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 " +
  "[&_a]:text-indigo-600 [&_a]:underline-offset-2 hover:[&_a]:underline [&_strong]:font-medium [&_strong]:text-zinc-900 dark:[&_strong]:text-zinc-100 " +
  "[&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1 [&_code]:text-xs dark:[&_code]:bg-zinc-900 " +
  "[&_blockquote]:border-l-2 [&_blockquote]:border-zinc-200 [&_blockquote]:pl-3 [&_blockquote]:text-zinc-500 dark:[&_blockquote]:border-zinc-800 " +
  "[&_table]:w-full [&_table]:text-left [&_table]:text-xs [&_th]:border-b [&_th]:border-zinc-200 [&_th]:py-2 [&_th]:pr-3 [&_th]:font-medium dark:[&_th]:border-zinc-800 " +
  "[&_td]:border-b [&_td]:border-zinc-100 [&_td]:py-2 [&_td]:pr-3 [&_td]:align-top dark:[&_td]:border-zinc-900";

export function Markdown({ children }: { children: string }) {
  return (
    <div className={PROSE}>
      <div className="overflow-x-auto">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{ a: (props) => <a {...props} target="_blank" rel="noreferrer" /> }}
        >
          {children}
        </ReactMarkdown>
      </div>
    </div>
  );
}
