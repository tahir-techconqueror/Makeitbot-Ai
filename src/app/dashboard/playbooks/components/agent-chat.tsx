// src/app/dashboard/playbooks/components/agent-chat.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChatMediaPreview, extractMediaFromToolResponse } from '@/components/chat/chat-media-preview';
import { useSearchParams } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Upload,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Check,
  CheckCircle2,
  Loader2,
  Mail,
  FolderOpen,
  Calendar,
  Globe,
  Sparkles,
  Brain,
  Zap,
  Rocket,
  Briefcase,
  ShoppingCart,
  Search,
  ShieldCheck,
  Wrench,
  Settings,
  Copy,
  CheckCircle,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  Lock,
  Leaf,
  Megaphone,
  BarChart3,
  DollarSign,
  Heart,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { runAgentChat, cancelAgentJob } from '../../ceo/agents/actions';
import { AgentPersona } from '../../ceo/agents/personas';
import { useAgentChatStore } from '@/lib/store/agent-chat-store';
import { AudioRecorder } from '@/components/ui/audio-recorder';
import { ModelSelector, ThinkingLevel } from '../../ceo/components/model-selector';
import { useJobPoller } from '@/hooks/use-job-poller';
import { ProjectSelector } from '@/components/dashboard/project-selector';
import type { Project } from '@/types/project';
import { AttachmentPreviewList, AttachmentItem } from '@/components/ui/attachment-preview';
import { ArtifactPanel, ArtifactCard } from '@/components/artifacts';
import { Artifact, parseArtifactsFromContent, createArtifactId } from '@/types/artifact';
import { shareArtifact } from '@/server/actions/artifacts';

// ------------------------------------------------
// Types
// ------------------------------------------------

export type { ChatMessage } from '@/lib/store/agent-chat-store';

export interface ToolCallStep {
  id: string;
  toolName: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  durationMs?: number;
  subagentId?: string;
  isComputerUse?: boolean;
}

export interface ToolPermission {
  id: string;
  name: string;
  icon: 'mail' | 'drive' | 'calendar' | 'web';
  email?: string;
  description: string;
  status: 'pending' | 'granted' | 'denied';
  tools: string[];
}

export interface PuffTrigger {
  id: string;
  type: 'schedule' | 'webhook' | 'event';
  label: string;
  config?: Record<string, any>;
}

export interface PuffMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isThinking?: boolean;
  workDuration?: number;
  steps?: ToolCallStep[];
  metadata?: {
    type?: 'compliance_report' | 'product_rec' | 'elasticity_analysis' | 'session_context' | 'hire_modal' | 'system_health' | 'permission_info';
    data?: any;
    brandId?: string;
    brandName?: string;
    agentName?: string;
    role?: string;
    media?: {
      type: 'image' | 'video';
      url: string;
      prompt?: string;
      duration?: number;
      model?: string;
    } | null;
  };
}

export interface PuffState {
  title: string;
  isConnected: boolean;
  permissions: ToolPermission[];
  triggers: PuffTrigger[];
}

export type ToolMode = 'auto' | 'manual';
export type AvailableTool = 'gmail' | 'calendar' | 'drive' | 'search';

// ------------------------------------------------
// Persona & Tool Selectors (Dark Theme)
// ------------------------------------------------

function PersonaSelector({ value, onChange }: { value: AgentPersona; onChange: (v: AgentPersona) => void }) {
  const options: Record<AgentPersona, { label: string; desc: string; icon: any }> = {
    puff: { label: 'Puff', desc: 'General Assistant', icon: Sparkles },
    smokey: { label: 'Ember', desc: 'Budtender & Products', icon: Leaf },
    bigworm: { label: 'Big Worm', desc: 'Deep Research', icon: Search },
  };

  const SelectedIcon = options[value].icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs font-medium border border-zinc-700 hover:border-blue-600/50 hover:bg-zinc-900/70 text-zinc-200">
          <SelectedIcon className="h-3.5 w-3.5 text-blue-400" />
          {options[value].label}
          <ChevronDown className="h-3 w-3 opacity-60 text-zinc-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px] bg-zinc-950 border-zinc-800 text-white shadow-2xl backdrop-blur-md">
        <DropdownMenuLabel className="text-blue-400">Agent Persona</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-800" />
        {(Object.entries(options) as [AgentPersona, typeof options['puff']][]).map(([key, opt]) => (
          <DropdownMenuItem 
            key={key} 
            onClick={() => onChange(key)} 
            className="flex flex-col items-start gap-1 py-3 cursor-pointer hover:bg-zinc-900 text-white"
          >
            <div className="flex items-center gap-2.5 w-full">
              <opt.icon className="h-4 w-4 text-blue-400" />
              <span className="font-medium flex-1">{opt.label}</span>
              {value === key && <CheckCircle2 className="h-4 w-4 text-blue-400" />}
            </div>
            <span className="text-xs text-zinc-400 ml-6">{opt.desc}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ToolSelector({
  mode,
  selectedTools,
  onModeChange,
  onToggleTool
}: {
  mode: ToolMode;
  selectedTools: AvailableTool[];
  onModeChange: (mode: ToolMode) => void;
  onToggleTool: (tool: AvailableTool) => void;
}) {
  const tools: { id: AvailableTool; label: string; icon: any }[] = [
    { id: 'gmail', label: 'Gmail', icon: Mail },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'drive', label: 'Drive', icon: FolderOpen },
    { id: 'search', label: 'Web Search', icon: Globe },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs font-medium border border-zinc-700 hover:border-blue-600/50 hover:bg-zinc-900/70 text-zinc-200">
          <Wrench className="h-3.5 w-3.5 text-blue-400" />
          {mode === 'auto' ? 'Auto Tools' : `${selectedTools.length} Tools`}
          <ChevronDown className="h-3 w-3 opacity-60 text-zinc-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px] bg-zinc-950 border-zinc-800 text-white shadow-2xl backdrop-blur-md">
        <DropdownMenuLabel className="text-blue-400">Tool Settings</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-800" />
        <DropdownMenuItem onClick={() => onModeChange(mode === 'auto' ? 'manual' : 'auto')}>
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-white">Auto-detect</span>
            {mode === 'auto' && <Check className="h-4 w-4 text-blue-400" />}
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-zinc-800" />
        <DropdownMenuLabel className="text-xs font-normal text-zinc-400">
          Available Tools
        </DropdownMenuLabel>
        {tools.map(tool => (
          <DropdownMenuCheckboxItem
            key={tool.id}
            checked={selectedTools.includes(tool.id) || mode === 'auto'}
            onCheckedChange={() => {
              if (mode === 'auto') {
                onModeChange('manual');
              }
              onToggleTool(tool.id);
            }}
            className="hover:bg-zinc-900 text-white data-[checked]:bg-blue-950/60 data-[checked]:text-blue-300"
          >
            <div className="flex items-center gap-2">
              <tool.icon className="h-3.5 w-3.5 text-blue-400" />
              <span>{tool.label}</span>
            </div>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ------------------------------------------------
// MAIN AGENT CHAT COMPONENT – DARK THEME
// ------------------------------------------------

export interface PageContext {
  type: 'brand' | 'dispensary' | 'local';
  slug: string;
  name?: string;
  isOwner?: boolean;
}

export interface AgentChatProps {
  initialTitle?: string;
  initialInput?: string;
  initialInputVersion?: number;
  onBack?: () => void;
  onSubmit?: (message: string) => Promise<void>;
  pageContext?: PageContext;
  onPlaybookCreated?: (created: {
    title: string;
    description?: string;
    type?: 'SIGNAL' | 'AUTOMATION' | 'REPORTING' | 'INTEL' | 'OPS' | 'SEO' | 'COMPLIANCE' | 'FINANCE';
    prompt?: string;
  }) => void;
}

export function AgentChat({
  initialTitle = 'New Chat',
  initialInput = '',
  initialInputVersion = 0,
  onBack,
  onSubmit,
  pageContext,
  onPlaybookCreated
}: AgentChatProps) {
  const { 
    currentMessages, 
    addMessage, 
    updateMessage, 
    setCurrentRole,
    currentArtifacts,
    addArtifact 
  } = useAgentChatStore();

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showArtifactPanel, setShowArtifactPanel] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);

  const [state, setState] = useState<PuffState>({
    title: initialTitle,
    isConnected: true,
    permissions: [],
    triggers: [],
  });

  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => { setHasMounted(true); }, []);

  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showTriggers, setShowTriggers] = useState(false);
  const [showPermissions, setShowPermissions] = useState(true);
  const [thinkingLevel, setThinkingLevel] = useState<ThinkingLevel>('standard');
  const [persona, setPersona] = useState<AgentPersona>('puff');

  const [activeJob, setActiveJob] = useState<{ jobId: string; messageId: string } | null>(null);
  const { job, thoughts, isComplete, error: jobError } = useJobPoller(activeJob?.jobId);

  const [toolMode, setToolMode] = useState<ToolMode>('auto');
  const [selectedTools, setSelectedTools] = useState<AvailableTool[]>([]);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const inferPlaybookType = (text: string) => {
    const t = text.toLowerCase();
    if (t.includes('compliance')) return 'COMPLIANCE' as const;
    if (t.includes('seo')) return 'SEO' as const;
    if (t.includes('report') || t.includes('analytics') || t.includes('kpi')) return 'REPORTING' as const;
    if (t.includes('intel') || t.includes('competitor')) return 'INTEL' as const;
    if (t.includes('ops') || t.includes('inventory') || t.includes('stock')) return 'OPS' as const;
    if (t.includes('finance') || t.includes('pricing') || t.includes('margin')) return 'FINANCE' as const;
    return 'AUTOMATION' as const;
  };

  const emitCreatedPlaybook = (content: string, prompt: string, metadata?: any) => {
    if (!onPlaybookCreated || !content) return;
    const structured = metadata?.playbookCreated;
    if (structured?.name) {
      onPlaybookCreated({
        title: String(structured.name),
        description: structured.description ? String(structured.description) : 'Created via chat automation',
        type: inferPlaybookType(String(structured.category || '')),
        prompt,
      });
      return;
    }
    const nameMatch = content.match(/created a playbook called ["']([^"']+)["']/i);
    if (!nameMatch?.[1]) return;
    const descriptionMatch = content.match(/\*\*Description:\*\*\s*([^\n]+)/i);
    const categoryMatch = content.match(/\*\*Category:\*\*\s*([^\n]+)/i);
    const inferredType = inferPlaybookType(categoryMatch?.[1] || content);
    onPlaybookCreated({
      title: nameMatch[1].trim(),
      description: descriptionMatch?.[1]?.trim() || 'Created via chat automation',
      type: inferredType,
      prompt,
    });
  };

  // Keep chat input in sync when a playbook card injects a prompt.
  useEffect(() => {
    if (!initialInput || !initialInput.trim()) return;
    setInput(initialInput);
  }, [initialInput, initialInputVersion]);

  // Job polling ? UI update
  useEffect(() => {
    if (!activeJob) return;

    if (jobError) {
      updateMessage(activeJob.messageId, {
        content: `Job polling failed: ${jobError}`,
        thinking: { isThinking: false, steps: [], plan: [] },
      });
      setActiveJob(null);
      setIsProcessing(false);
      return;
    }

    if (thoughts.length > 0) {
      const steps: ToolCallStep[] = thoughts.map((t) => ({
        id: t.id,
        toolName: t.title || 'Thinking',
        description: t.detail || t.title || 'Processing...',
        status: 'in-progress',
        durationMs: t.durationMs,
      }));

      updateMessage(activeJob.messageId, {
        thinking: { isThinking: true, steps, plan: [] },
      });
    }

    if (!isComplete || !job) return;

    const result = job.result || {};

    if (job.status === 'failed') {
      updateMessage(activeJob.messageId, {
        content: `Request failed: ${job.error || 'Unknown error'}`,
        thinking: { isThinking: false, steps: [], plan: [] },
      });
      setActiveJob(null);
      setIsProcessing(false);
      return;
    }

    const resultContent = String(result.content || 'Done.');
    const { artifacts: parsed, cleanedContent } = parseArtifactsFromContent(resultContent);
    emitCreatedPlaybook(cleanedContent, input || initialInput, result.metadata);

    parsed.forEach((partial) => {
      if (!partial.type || !partial.title || !partial.content) return;
      addArtifact({
        id: partial.id || createArtifactId(),
        type: partial.type,
        title: partial.title,
        content: partial.content,
        metadata: partial.metadata,
        language: partial.language,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    const toolCalls = Array.isArray(result.toolCalls) ? result.toolCalls : [];
    const finishedSteps: ToolCallStep[] = toolCalls.map((tc: any) => ({
      id: tc.id || `tool-${Date.now()}`,
      toolName: tc.name || 'Tool',
      description: String(tc.result || tc.name || 'Completed'),
      status: tc.status === 'error' ? 'failed' : 'completed',
    }));

    updateMessage(activeJob.messageId, {
      content: cleanedContent,
      metadata: {
        ...result.metadata,
        media: extractMediaFromToolResponse(toolCalls),
      },
      thinking: { isThinking: false, steps: finishedSteps, plan: [] },
    });

    setActiveJob(null);
    setIsProcessing(false);
  }, [job, thoughts, isComplete, activeJob, updateMessage, jobError, addArtifact]);

  const handleToggleTool = (tool: AvailableTool) => {
    setSelectedTools(prev =>
      prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const incoming: AttachmentItem[] = [];
    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith('image/');
      const item: AttachmentItem = {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        type: isImage ? 'image' : 'file',
        name: file.name,
      };

      if (isImage) {
        const reader = new FileReader();
        reader.onload = () => {
          setAttachments((prev) => [...prev, { ...item, preview: String(reader.result || '') }]);
        };
        reader.readAsDataURL(file);
      } else {
        incoming.push(item);
      }
    });

    if (incoming.length > 0) {
      setAttachments((prev) => [...prev, ...incoming]);
    }

    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (!file) continue;

        const reader = new FileReader();
        reader.onload = () => {
          setAttachments((prev) => [
            ...prev,
            {
              id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              file,
              type: 'image',
              name: file.name || 'pasted-image.png',
              preview: String(reader.result || ''),
            },
          ]);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleAudioComplete = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      await submitMessage(input, base64);
    } catch {
      // no-op
    } finally {
      setIsTranscribing(false);
    }
  };

  const convertAttachments = async () => {
    const converted = await Promise.all(
      attachments.map(async (att) => {
        if (att.preview) {
          return {
            name: att.file?.name || att.name || 'attachment',
            type: att.file?.type || 'application/octet-stream',
            base64: att.preview,
          };
        }

        if (att.content) {
          return {
            name: att.name || 'pasted-content.txt',
            type: 'text/plain',
            base64: att.content,
          };
        }

        if (att.file) {
          const reader = new FileReader();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = reject;
            reader.readAsDataURL(att.file as File);
          });

          return {
            name: att.file.name,
            type: att.file.type || 'application/octet-stream',
            base64: dataUrl,
          };
        }

        return null;
      })
    );

    return converted.filter(Boolean) as { name: string; type: string; base64: string }[];
  };

  const submitMessage = useCallback(async (textInput: string, audioBase64?: string) => {
    if (isProcessing) return;

    const trimmed = textInput.trim();
    if (!trimmed && attachments.length === 0 && !audioBase64) return;

    const userMessageId = `msg-user-${Date.now()}`;
    const assistantMessageId = `msg-agent-${Date.now() + 1}`;

    const userMessage = {
      id: userMessageId,
      type: 'user' as const,
      content: trimmed || '[Attachment sent]',
      timestamp: new Date(),
      attachments: attachments.map((att) => ({
        id: att.id,
        name: att.file?.name || att.name || 'attachment',
        type: att.file?.type || (att.type === 'image' ? 'image/png' : 'application/octet-stream'),
        url: att.preview || att.content || '',
        preview: att.preview,
      })),
    };

    addMessage(userMessage);
    setInput('');
    setIsProcessing(true);

    addMessage({
      id: assistantMessageId,
      type: 'agent',
      content: '',
      timestamp: new Date(),
      thinking: { isThinking: true, steps: [], plan: [] },
    });

    try {
      const convertedAttachments = await convertAttachments();
      const result = await runAgentChat(trimmed || 'Analyze attachment', persona, {
        modelLevel: thinkingLevel,
        audioInput: audioBase64,
        attachments: convertedAttachments.length ? convertedAttachments : undefined,
        projectId: selectedProject?.id,
        source: 'playbooks',
        context: {
          toolMode,
          selectedTools,
        },
      });

      if (result.metadata?.jobId) {
        setActiveJob({ jobId: result.metadata.jobId, messageId: assistantMessageId });
        return;
      }

      const resultContent = String(result.content || 'Done.');
      const { artifacts: parsed, cleanedContent } = parseArtifactsFromContent(resultContent);
      emitCreatedPlaybook(cleanedContent, trimmed || initialInput, result.metadata);

      parsed.forEach((partial) => {
        if (!partial.type || !partial.title || !partial.content) return;
        addArtifact({
          id: partial.id || createArtifactId(),
          type: partial.type,
          title: partial.title,
          content: partial.content,
          metadata: partial.metadata,
          language: partial.language,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      const toolCalls = result.toolCalls || [];
      const steps: ToolCallStep[] = toolCalls.map((tc) => ({
        id: tc.id,
        toolName: tc.name,
        description: String(tc.result || tc.name),
        status: tc.status === 'error' ? 'failed' : 'completed',
      }));

      updateMessage(assistantMessageId, {
        content: cleanedContent,
        metadata: {
          ...result.metadata,
          media: extractMediaFromToolResponse(toolCalls),
        },
        thinking: { isThinking: false, steps, plan: [] },
      });
    } catch (err: any) {
      updateMessage(assistantMessageId, {
        content: `Error: ${err?.message || 'Failed to process request'}`,
        thinking: { isThinking: false, steps: [], plan: [] },
      });
    } finally {
      setAttachments([]);
      setIsProcessing(false);
    }
  }, [isProcessing, attachments, addMessage, updateMessage, persona, thinkingLevel, selectedProject, toolMode, selectedTools, addArtifact]);

  const handleSubmit = () => submitMessage(input);

  const handleGrantPermission = (permissionId: string) => {
    setState(prev => ({
      ...prev,
      permissions: prev.permissions.map(p =>
        p.id === permissionId ? { ...p, status: 'granted' } : p
      ),
    }));
  };

  if (!hasMounted) return null;

  const displayMessages: PuffMessage[] = currentMessages.map(m => ({
    id: m.id,
    role: m.type === 'agent' ? 'assistant' : 'user',
    content: m.content,
    timestamp: new Date(m.timestamp),
    isThinking: m.thinking?.isThinking,
    steps: m.thinking?.steps,
    metadata: m.metadata,
    workDuration: 0
  }));

  const hasMessages = displayMessages.length > 0;

  const InputArea = (
    <div className="p-4 border-t border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
      {attachments.length > 0 && (
        <div className="mb-4 max-w-3xl mx-auto">
          <AttachmentPreviewList attachments={attachments} onRemove={removeAttachment} />
        </div>
      )}

      <div className="max-w-3xl mx-auto bg-zinc-950 rounded-xl border border-zinc-800 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all p-4 space-y-4 shadow-inner">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onPaste={handlePaste}
          placeholder={hasMessages ? "Reply, or use microphone..." : "Ask anything..."}
          className="min-h-[60px] border-0 bg-transparent resize-none p-0 focus-visible:ring-0 shadow-none text-base text-white placeholder:text-zinc-500"
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-900/70" onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="h-5 w-5" />
            </Button>
            <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileSelect} />

            <div className="h-5 w-[1px] bg-zinc-800 mx-1" />

            <div className="border-l border-zinc-800 pl-3 flex items-center gap-2">
              <PersonaSelector value={persona} onChange={setPersona} />
              <ModelSelector
                value={thinkingLevel}
                onChange={setThinkingLevel}
                userPlan="pro"
                isSuperUser={true}
                unlockResearch={true}
              />
              <ToolSelector
                mode={toolMode}
                selectedTools={selectedTools}
                onModeChange={setToolMode}
                onToggleTool={handleToggleTool}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AudioRecorder onRecordingComplete={handleAudioComplete} isProcessing={isTranscribing} />
            {isProcessing ? (
              <Button size="icon" variant="destructive" className="h-9 w-9 rounded-full" onClick={() => {/* stop logic */}}>
                <div className="h-3 w-3 bg-white rounded-[2px]" />
              </Button>
            ) : (
              <Button
                size="icon"
                className={cn(
                  "h-9 w-9 rounded-full shadow-md",
                  input.trim() || attachments.length > 0 
                    ? "bg-blue-600 hover:bg-blue-500 text-white" 
                    : "bg-zinc-900 text-zinc-500"
                )}
                disabled={!input.trim() && attachments.length === 0}
                onClick={handleSubmit}
              >
                <Sparkles className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {!hasMessages && (
        <div className="mt-4 text-center text-xs text-zinc-500">
          AI responses may contain mistakes — verify important information.
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl shadow-black/40">
        {hasMessages && (
          <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              {onBack && (
                <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 text-zinc-300 hover:text-white hover:bg-zinc-900/70">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <h2 className="font-bold text-lg text-blue-400">{state.title}</h2>
            </div>
            <div className="flex items-center gap-3">
              {currentArtifacts.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowArtifactPanel(!showArtifactPanel)}
                  className="border-zinc-700 text-zinc-200 hover:bg-zinc-900 hover:text-white"
                >
                  <Sparkles className="h-4 w-4 mr-1.5 text-blue-400" />
                  {currentArtifacts.length}
                </Button>
              )}
              {state.isConnected && (
                <Badge variant="outline" className="bg-zinc-900/70 text-blue-300 border-blue-800/50">
                  Connected
                </Badge>
              )}
            </div>
          </div>
        )}

        {!hasMessages && InputArea}

        {hasMessages && (
              <ScrollArea className="flex-1 bg-zinc-950/90">
                <div className="p-5 md:p-6 space-y-5">
                  {displayMessages.map((message) => (
                    <div key={message.id} className={cn("flex", message.role === 'user' ? "justify-end" : "justify-start")}>
                      <Card className={cn(
                        "max-w-[85%] border-zinc-800",
                        message.role === 'user' ? "bg-blue-600/15" : "bg-zinc-900/70"
                      )}>
                        <CardContent className="p-3 space-y-2">
                          {message.isThinking ? (
                            <div className="flex items-center gap-2 text-zinc-300 text-sm">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Working...</span>
                            </div>
                          ) : (
                            <div className="text-sm text-zinc-100 prose prose-invert max-w-none">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                            </div>
                          )}
                          {message.metadata?.media && (
                            <ChatMediaPreview media={message.metadata.media as any} />
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </ScrollArea>
        )}

        {hasMessages && InputArea}
      </div>

      <ArtifactPanel
        artifacts={currentArtifacts}
        selectedArtifact={selectedArtifact}
        onSelect={setSelectedArtifact}
        onClose={() => {
          setShowArtifactPanel(false);
          setSelectedArtifact(null);
        }}
        onShare={async (artifact) => {
          const result = await shareArtifact(artifact.id, artifact.title, artifact.content, artifact.type, artifact.metadata);
          if (!result.success) {
            throw new Error('Failed to share artifact');
          }
        }}
        isOpen={showArtifactPanel}
      />
    </>
  );
}

