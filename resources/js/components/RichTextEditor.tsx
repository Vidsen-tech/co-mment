// resources/js/components/RichTextEditor.tsx

import React from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { Bold, Italic, Pilcrow, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

// Define the Toolbar component
const Toolbar = ({ editor }: { editor: Editor | null }) => {
    if (!editor) {
        return null;
    }

    return (
        <div className="border border-input bg-transparent rounded-t-md p-2 flex flex-wrap items-center gap-2">
            <Toggle
                size="sm"
                pressed={editor.isActive('bold')}
                onPressedChange={() => editor.chain().focus().toggleBold().run()}
            >
                <Bold className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                pressed={editor.isActive('italic')}
                onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            >
                <Italic className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                pressed={editor.isActive('paragraph')}
                onPressedChange={() => editor.chain().focus().setParagraph().run()}
            >
                <Pilcrow className="h-4 w-4" />
            </Toggle>

            <div className="h-6 w-px bg-border mx-1" />

            <Toggle
                size="sm"
                pressed={editor.isActive({ textAlign: 'left' })}
                onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
            >
                <AlignLeft className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                pressed={editor.isActive({ textAlign: 'center' })}
                onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
            >
                <AlignCenter className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                pressed={editor.isActive({ textAlign: 'right' })}
                onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
            >
                <AlignRight className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                pressed={editor.isActive({ textAlign: 'justify' })}
                onPressedChange={() => editor.chain().focus().setTextAlign('justify').run()}
            >
                <AlignJustify className="h-4 w-4" />
            </Toggle>
        </div>
    );
};

// Define the main RichTextEditor component
interface RichTextEditorProps {
    content: string;
    onChange: (richText: string) => void;
    className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, className }) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                // We don't need all starter kit features for now
                heading: { levels: [2, 3, 4] },
                blockquote: false,
                codeBlock: false,
                code: false,
                horizontalRule: false,
                listItem: false,
                bulletList: false,
                orderedList: false,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
        ],
        content: content,
        editorProps: {
            attributes: {
                class: cn(
                    'prose dark:prose-invert max-w-none min-h-[150px] rounded-b-md border border-input border-t-0 bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                    className
                ),
            },
        },
        onUpdate({ editor }) {
            onChange(editor.getHTML());
        },
    });

    return (
        <div>
            <Toolbar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
};

export default RichTextEditor;
