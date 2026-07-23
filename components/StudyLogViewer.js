'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * StudyLogViewer — renders study log markdown using react-markdown.
 *
 * @param {object} props
 * @param {string} props.content - markdown text
 */
export default function StudyLogViewer({ content }) {
  return (
    <div className="study-log-viewer markdown-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
