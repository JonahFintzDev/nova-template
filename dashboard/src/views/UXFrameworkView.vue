<script setup lang="ts">
import { ref } from 'vue';
import {
  Sparkles,
  Plus,
  Trash2,
  Settings,
  Download,
  MoreHorizontal,
  GripVertical,
  User,
  Lock,
  Search,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  X,
  Star,
  FileText,
  Bell,
  Inbox,
  Mail,
} from 'lucide-vue-next';
import PageShell from '@/components/layout/PageShell.vue';
import PageHeader from '@/components/layout/PageHeader.vue';
import Modal from '@/components/ui/Modal.vue';
import Toast from '@/components/ui/Toast.vue';
import DatePicker from '@/components/ui/DatePicker.vue';
import ApiOfflineBanner from '@/components/ui/ApiOfflineBanner.vue';
import ButtonMultiselect from '@/components/ui/ButtonMultiselect.vue';
import ColorPicker from '@/components/ui/ColorPicker.vue';
import IconPicker from '@/components/ui/IconPicker.vue';
import TagChipsInput from '@/components/ui/TagChipsInput.vue';

// ── State ──────────────────────────────────────────────────
const activeTab = ref('buttons');
const activeSegment = ref('week');
const checkbox1 = ref(false);
const checkbox2 = ref(true);
const radio1 = ref('a');
const switchOn = ref(false);
const taskDone = ref(false);
const progressVal = ref(65);

const modalOpen = ref(false);
const toastRef = ref<InstanceType<typeof Toast> | null>(null);

const dateValue = ref<Date | null>(null);
const dateHasTime = ref(false);

const multiSelectValue = ref('day');
const colorValue = ref<string | null>('#4f46e5');
const iconValue = ref<string | null>(null);
const tagIds = ref<string[]>(['tag-1']);
const allTags = [
  { id: 'tag-1', name: 'Design', color: '#3b82f6' },
  { id: 'tag-2', name: 'Dev', color: '#22c55e' },
  { id: 'tag-3', name: 'Bug', color: '#ef4444' },
  { id: 'tag-4', name: 'Feature' },
  { id: 'tag-5', name: 'Docs', color: '#eab308' },
];

const showToast = (kind: 'success' | 'error' | 'warning' | 'info') => {
  const messages = {
    success: { title: 'Changes saved', sub: 'Your profile has been updated.' },
    error: { title: 'Something went wrong', sub: 'Could not connect to server.' },
    warning: { title: 'Unsaved changes', sub: 'You have unsaved edits.' },
    info: { title: 'New update available', sub: 'Version 2.1.0 is ready to install.' },
  };
  toastRef.value?.add({ kind, ...messages[kind] });
};

const tableRows = [
  { name: 'Alice Müller', role: 'Admin', status: 'active', date: '2024-01-15' },
  { name: 'Bob Carter', role: 'Editor', status: 'active', date: '2024-02-28' },
  { name: 'Carla Rossi', role: 'Viewer', status: 'inactive', date: '2024-03-10' },
  { name: 'Daniel Park', role: 'Editor', status: 'active', date: '2024-04-05' },
];
</script>

<template>
  <div>
    <PageShell>
      <PageHeader title="Nova Design System" />
      <div class="mb-14 pb-8 border-b border-[var(--border-soft)]">
        <p class="body-lg text-2 mt-2">All components, tokens, and patterns — live in the app.</p>
        <div class="flex gap-2 mt-4">
          <span class="tag pill success"><span class="dot"></span>Design framework v1</span>
          <span class="tag pill neutral">Vue 3 + CSS tokens</span>
        </div>
      </div>

      <!-- ── Typography ───────────────────────────────────── -->
      <section id="section-typography" class="mb-16 scroll-mt-6">
        <h2
          class="text-[11px] font-semibold uppercase tracking-[0.08em] text-3 mb-4 pb-2 border-b border-[var(--border-soft)]"
        >
          Typography
        </h2>
        <div class="space-y-4">
          <div class="py-2 border-b border-[var(--border-soft)] last:border-b-0">
            <span class="display-1">Display 1 — 56/1.0</span>
          </div>
          <div class="py-2 border-b border-[var(--border-soft)] last:border-b-0">
            <span class="display-2">Display 2 — 40/1.05</span>
          </div>
          <div class="py-2 border-b border-[var(--border-soft)] last:border-b-0">
            <h1>Heading 1 — 32/1.1</h1>
          </div>
          <div class="py-2 border-b border-[var(--border-soft)] last:border-b-0">
            <h2>Heading 2 — 24/1.2</h2>
          </div>
          <div class="py-2 border-b border-[var(--border-soft)] last:border-b-0">
            <h3>Heading 3 — 18/1.3</h3>
          </div>
          <div class="py-2 border-b border-[var(--border-soft)] last:border-b-0">
            <h4>Heading 4 — 15/1.4</h4>
          </div>
          <div class="py-2 border-b border-[var(--border-soft)] last:border-b-0">
            <span class="body-lg">Body large — 16/1.5 regular</span>
          </div>
          <div class="py-2 border-b border-[var(--border-soft)] last:border-b-0">
            <span class="body"
              >Body — 14/1.5 regular, the default running text size used across the app</span
            >
          </div>
          <div class="py-2 border-b border-[var(--border-soft)] last:border-b-0">
            <span class="caption">Caption — 12.5/1.4 · Secondary metadata, timestamps, hints</span>
          </div>
          <div class="py-2 border-b border-[var(--border-soft)] last:border-b-0">
            <span class="mono">Mono — 13/1.4 · API keys, code snippets, shortcuts</span>
          </div>
        </div>
      </section>

      <!-- ── Colors ───────────────────────────────────────── -->
      <section id="section-colors" class="mb-16 scroll-mt-6">
        <h2
          class="text-[11px] font-semibold uppercase tracking-[0.08em] text-3 mb-4 pb-2 border-b border-[var(--border-soft)]"
        >
          Color tokens
        </h2>
        <div>
          <div class="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-3">
            <div
              class="h-[72px] rounded-md border border-transparent flex items-end p-2"
              style="background: var(--bg-base)"
            >
              <span class="text-[11px] font-mono font-medium text-3">bg-base</span>
            </div>
            <div
              class="h-[72px] rounded-md border border-transparent flex items-end p-2"
              style="background: var(--bg-surface); border-color: var(--border)"
            >
              <span class="text-[11px] font-mono font-medium text-3">bg-surface</span>
            </div>
            <div
              class="h-[72px] rounded-md border border-transparent flex items-end p-2"
              style="background: var(--bg-elevated); border-color: var(--border)"
            >
              <span class="text-[11px] font-mono font-medium text-3">bg-elevated</span>
            </div>
            <div
              class="h-[72px] rounded-md border border-transparent flex items-end p-2"
              style="background: var(--bg-input); border-color: var(--border)"
            >
              <span class="text-[11px] font-mono font-medium text-3">bg-input</span>
            </div>
            <div
              class="h-[72px] rounded-md border border-transparent flex items-end p-2"
              style="background: var(--bg-hover); border-color: var(--border)"
            >
              <span class="text-[11px] font-mono font-medium text-3">bg-hover</span>
            </div>
            <div
              class="h-[72px] rounded-md border border-transparent flex items-end p-2"
              style="background: var(--primary)"
            >
              <span class="text-[11px] font-mono font-medium" style="color: #fff">primary</span>
            </div>
            <div
              class="h-[72px] rounded-md border border-transparent flex items-end p-2"
              style="background: var(--primary-bg); border-color: var(--primary-border)"
            >
              <span class="text-[11px] font-mono font-medium text-primary">primary-bg</span>
            </div>
            <div
              class="h-[72px] rounded-md border border-transparent flex items-end p-2"
              style="background: var(--accent)"
            >
              <span class="text-[11px] font-mono font-medium" style="color: #fff">accent</span>
            </div>
            <div
              class="h-[72px] rounded-md border border-transparent flex items-end p-2"
              style="background: var(--success)"
            >
              <span class="text-[11px] font-mono font-medium" style="color: #fff">success</span>
            </div>
            <div
              class="h-[72px] rounded-md border border-transparent flex items-end p-2"
              style="background: var(--warning)"
            >
              <span class="text-[11px] font-mono font-medium" style="color: #fff">warning</span>
            </div>
            <div
              class="h-[72px] rounded-md border border-transparent flex items-end p-2"
              style="background: var(--danger)"
            >
              <span class="text-[11px] font-mono font-medium" style="color: #fff">danger</span>
            </div>
            <div
              class="h-[72px] rounded-md border border-transparent flex items-end p-2"
              style="background: var(--info)"
            >
              <span class="text-[11px] font-mono font-medium" style="color: #fff">info</span>
            </div>
          </div>
          <div class="flex gap-4 mt-6 flex-wrap">
            <div v-for="n in [1, 2, 3, 4]" :key="n" class="flex items-center gap-2">
              <div class="avatar" :class="`tinted-${n}`">{{ ['A', 'B', 'C', 'D'][n - 1] }}</div>
              <span class="text-sm text-2">tint {{ n }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Buttons ──────────────────────────────────────── -->
      <section id="section-buttons" class="mb-16 scroll-mt-6">
        <h2
          class="text-[11px] font-semibold uppercase tracking-[0.08em] text-3 mb-4 pb-2 border-b border-[var(--border-soft)]"
        >
          Buttons
        </h2>
        <div class="space-y-6">
          <!-- Variants -->
          <div>
            <p class="caption mb-3">Variants</p>
            <div class="flex flex-wrap gap-3">
              <button class="btn btn-primary"><Plus :size="16" />Primary</button>
              <button class="btn btn-soft"><Sparkles :size="16" />Soft</button>
              <button class="btn btn-secondary"><Settings :size="16" />Secondary</button>
              <button class="btn btn-ghost"><X :size="16" />Ghost</button>
              <button class="btn btn-danger"><Trash2 :size="16" />Danger</button>
              <button class="btn btn-accent"><Star :size="16" />Accent</button>
            </div>
          </div>
          <!-- Sizes -->
          <div>
            <p class="caption mb-3">Sizes</p>
            <div class="flex flex-wrap items-center gap-3">
              <button class="btn btn-primary btn-sm"><Plus :size="14" />Small</button>
              <button class="btn btn-primary"><Plus :size="16" />Default</button>
              <button class="btn btn-primary btn-lg"><Plus :size="18" />Large</button>
              <button class="btn btn-secondary btn-icon btn-sm">
                <MoreHorizontal :size="14" />
              </button>
              <button class="btn btn-secondary btn-icon"><MoreHorizontal :size="16" /></button>
              <button class="btn btn-secondary btn-icon btn-lg">
                <MoreHorizontal :size="18" />
              </button>
            </div>
          </div>
          <!-- States -->
          <div>
            <p class="caption mb-3">States</p>
            <div class="flex flex-wrap items-center gap-3">
              <button class="btn btn-primary">Normal</button>
              <button class="btn btn-primary is-loading">
                <span class="btn-spinner"></span>Loading
              </button>
              <button class="btn btn-primary" disabled>Disabled</button>
              <button class="btn btn-primary btn-block" style="max-width: 200px">Block</button>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Inputs ───────────────────────────────────────── -->
      <section id="section-inputs" class="mb-16 scroll-mt-6">
        <h2
          class="text-[11px] font-semibold uppercase tracking-[0.08em] text-3 mb-4 pb-2 border-b border-[var(--border-soft)]"
        >
          Inputs
        </h2>
        <div class="space-y-6">
          <!-- States -->
          <div class="grid grid-cols-2 gap-4" style="max-width: 640px">
            <div class="field">
              <label class="field-label">Default</label>
              <div class="input">
                <User :size="15" />
                <input placeholder="Username" />
              </div>
            </div>
            <div class="field">
              <label class="field-label">Focused</label>
              <div class="input input-focused">
                <Mail :size="15" />
                <input placeholder="Email address" value="alice@example.com" readonly />
              </div>
            </div>
            <div class="field">
              <label class="field-label">Error</label>
              <div class="input input-error">
                <Lock :size="15" />
                <input placeholder="Password" value="badpass" readonly />
              </div>
              <div class="field-error"><AlertCircle :size="13" />Password is too short</div>
            </div>
            <div class="field">
              <label class="field-label">Disabled</label>
              <div class="input input-disabled">
                <User :size="15" />
                <input placeholder="Cannot edit" readonly />
              </div>
            </div>
            <div class="field">
              <label class="field-label">With hint</label>
              <div class="input">
                <Search :size="15" />
                <input placeholder="Search tasks…" />
              </div>
              <div class="field-hint">Supports name, tag, or assignee search.</div>
            </div>
            <div class="field">
              <label class="field-label">Sizes</label>
              <div class="space-y-2">
                <div class="input input-sm">
                  <input class="text-[11px]" placeholder="Small (32px)" />
                </div>
                <div class="input"><input placeholder="Default (38px)" /></div>
                <div class="input input-lg"><input placeholder="Large (44px)" /></div>
              </div>
            </div>
          </div>

          <!-- Textarea -->
          <div class="field" style="max-width: 480px">
            <label class="field-label">Textarea</label>
            <div class="textarea">
              <textarea placeholder="Describe this task…" rows="3"></textarea>
            </div>
          </div>

          <!-- Select -->
          <div class="field" style="max-width: 240px">
            <label class="field-label">Native select</label>
            <select class="native-select">
              <option>Option one</option>
              <option>Option two</option>
              <option>Option three</option>
            </select>
          </div>

          <!-- DatePicker -->
          <div class="field" style="max-width: 320px">
            <label class="field-label">Date &amp; time picker</label>
            <DatePicker
              v-model:date="dateValue"
              v-model:has-time="dateHasTime"
              placeholder="Pick a date"
            />
            <div v-if="dateValue" class="field-hint">
              Selected: {{ dateValue.toLocaleString() }} —
              <span
                class="text-primary cursor-pointer"
                @click="
                  dateValue = null;
                  dateHasTime = false;
                "
                >Clear</span
              >
            </div>
          </div>

          <!-- ApiOfflineBanner -->
          <div class="field">
            <label class="field-label">Offline banner</label>
            <ApiOfflineBanner
              message="You are working offline."
              sub-message="3 changes pending sync."
            />
          </div>

          <!-- ButtonMultiselect -->
          <div class="field">
            <label class="field-label">Button multiselect</label>
            <ButtonMultiselect
              v-model="multiSelectValue"
              :options="[
                { value: 'day', label: 'Day' },
                { value: 'week', label: 'Week' },
                { value: 'month', label: 'Month' },
              ]"
              aria-label="View range"
            />
            <div class="field-hint">Selected: {{ multiSelectValue }}</div>
          </div>

          <!-- ColorPicker -->
          <div class="field" style="max-width: 320px">
            <label class="field-label">Color picker</label>
            <ColorPicker v-model="colorValue" />
            <div v-if="colorValue" class="field-hint">Selected: {{ colorValue }}</div>
          </div>

          <!-- IconPicker -->
          <div class="field" style="max-width: 400px">
            <label class="field-label">Icon picker</label>
            <IconPicker v-model="iconValue" />
            <div v-if="iconValue" class="field-hint">Selected: {{ iconValue }}</div>
          </div>

          <!-- TagChipsInput -->
          <div class="field" style="max-width: 480px">
            <label class="field-label">Tag chips input</label>
            <TagChipsInput v-model="tagIds" :all-tags="allTags" />
            <div class="field-hint">Selected IDs: {{ tagIds.join(', ') || 'none' }}</div>
          </div>
        </div>
      </section>

      <!-- ── Selection controls ───────────────────────────── -->
      <section id="section-selection" class="mb-16 scroll-mt-6">
        <h2
          class="text-[11px] font-semibold uppercase tracking-[0.08em] text-3 mb-4 pb-2 border-b border-[var(--border-soft)]"
        >
          Selection controls
        </h2>
        <div class="space-y-6">
          <!-- Checkboxes -->
          <div>
            <p class="caption mb-3">Checkbox</p>
            <div class="flex gap-4 flex-wrap items-center">
              <div
                class="checkbox"
                :class="{ 'checkbox-checked': checkbox1 }"
                role="checkbox"
                :aria-checked="checkbox1"
                @click="checkbox1 = !checkbox1"
              ></div>
              <div class="checkbox checkbox-checked"></div>
              <div class="checkbox checkbox-indeterminate"></div>
              <div class="checkbox checkbox-disabled"></div>
              <label class="flex items-center gap-2 cursor-pointer" @click="checkbox2 = !checkbox2">
                <div class="checkbox" :class="{ 'checkbox-checked': checkbox2 }"></div>
                <span class="text-sm">With label (click me)</span>
              </label>
            </div>
          </div>

          <!-- Radios -->
          <div>
            <p class="caption mb-3">Radio</p>
            <div class="flex gap-4 items-center">
              <label
                v-for="opt in ['a', 'b', 'c']"
                :key="opt"
                class="flex items-center gap-2 cursor-pointer"
                @click="radio1 = opt"
              >
                <div class="radio" :class="{ 'radio-checked': radio1 === opt }"></div>
                <span class="text-sm">Option {{ opt.toUpperCase() }}</span>
              </label>
            </div>
          </div>

          <!-- Task check -->
          <div>
            <p class="caption mb-3">Task checkbox</p>
            <label class="flex items-center gap-3 cursor-pointer" @click="taskDone = !taskDone">
              <div class="task-check" :class="{ done: taskDone }"></div>
              <span class="text-sm" :class="{ 'text-3': taskDone, 'line-through': taskDone }">
                Finalize Q4 roadmap deck
              </span>
            </label>
          </div>

          <!-- Switch -->
          <div>
            <p class="caption mb-3">Switch</p>
            <div class="flex gap-4 items-center flex-wrap">
              <div
                class="switch"
                :class="{ on: switchOn }"
                role="switch"
                :aria-checked="switchOn"
                @click="switchOn = !switchOn"
              ></div>
              <span class="text-sm">{{ switchOn ? 'Enabled' : 'Disabled' }}</span>
              <div class="switch on"></div>
              <span class="text-sm text-2">Always on</span>
            </div>
          </div>

          <!-- Segmented -->
          <div>
            <p class="caption mb-3">Segmented control</p>
            <ButtonMultiselect
              v-model="activeSegment"
              :options="[
                { value: 'day', label: 'Day' },
                { value: 'week', label: 'Week' },
                { value: 'month', label: 'Month' },
              ]"
              aria-label="View range"
            />
          </div>
        </div>
      </section>

      <!-- ── Tags ─────────────────────────────────────────── -->
      <section id="section-tags" class="mb-16 scroll-mt-6">
        <h2
          class="text-[11px] font-semibold uppercase tracking-[0.08em] text-3 mb-4 pb-2 border-b border-[var(--border-soft)]"
        >
          Tags &amp; badges
        </h2>
        <div class="space-y-4">
          <div>
            <p class="caption mb-3">Default (squared)</p>
            <div class="flex flex-wrap gap-2">
              <span class="tag">Primary</span>
              <span class="tag solid">Solid</span>
              <span class="tag neutral">Neutral</span>
              <span class="tag success">Success</span>
              <span class="tag warning">Warning</span>
              <span class="tag danger">Danger</span>
              <span class="tag accent">Accent</span>
              <span class="tag info">Info</span>
            </div>
          </div>
          <div>
            <p class="caption mb-3">Pill with dot indicator</p>
            <div class="flex flex-wrap gap-2">
              <span class="tag pill success"><span class="dot"></span>Completed</span>
              <span class="tag pill warning"><span class="dot"></span>In progress</span>
              <span class="tag pill danger"><span class="dot"></span>Blocked</span>
              <span class="tag pill neutral"><span class="dot"></span>Backlog</span>
              <span class="tag pill info"><span class="dot"></span>In review</span>
            </div>
          </div>
          <div>
            <p class="caption mb-3">Large</p>
            <div class="flex flex-wrap gap-2">
              <span class="tag lg pill success"><span class="dot"></span>Completed</span>
              <span class="tag lg warning">High priority</span>
              <span class="tag lg neutral">Draft</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Avatars ───────────────────────────────────────── -->
      <section id="section-avatars" class="mb-16 scroll-mt-6">
        <h2
          class="text-[11px] font-semibold uppercase tracking-[0.08em] text-3 mb-4 pb-2 border-b border-[var(--border-soft)]"
        >
          Avatars
        </h2>
        <div class="space-y-4">
          <div>
            <p class="caption mb-3">Tints &amp; sizes</p>
            <div class="flex items-end gap-3 flex-wrap">
              <div class="avatar avatar-sm tinted-1">AM</div>
              <div class="avatar tinted-2">BC</div>
              <div class="avatar avatar-lg tinted-3">CR</div>
              <div class="avatar tinted-4">DP</div>
              <div class="avatar avatar-lg tinted-1">EF</div>
            </div>
          </div>
          <div>
            <p class="caption mb-3">Stack</p>
            <div class="avatar-stack">
              <div class="avatar tinted-1">A</div>
              <div class="avatar tinted-2">B</div>
              <div class="avatar tinted-3">C</div>
              <div class="avatar tinted-4">D</div>
              <div
                class="avatar neutral"
                style="
                  background: var(--bg-elevated);
                  color: var(--text-2);
                  border-color: var(--bg-surface);
                "
              >
                +4
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Cards ────────────────────────────────────────── -->
      <section id="section-cards" class="mb-16 scroll-mt-6">
        <h2
          class="text-[11px] font-semibold uppercase tracking-[0.08em] text-3 mb-4 pb-2 border-b border-[var(--border-soft)]"
        >
          Cards
        </h2>
        <div class="grid grid-cols-2 max-lg:grid-cols-1 gap-4" style="max-width: 720px">
          <div class="card">
            <div class="head">
              <h4>Task summary</h4>
              <span class="sub">This week</span>
            </div>
            <div class="flex gap-4">
              <div>
                <div class="text-2xl font-semibold text-primary">24</div>
                <div class="caption mt-1">Open tasks</div>
              </div>
              <div>
                <div class="text-2xl font-semibold text-success">18</div>
                <div class="caption mt-1">Completed</div>
              </div>
              <div>
                <div class="text-2xl font-semibold text-warning">6</div>
                <div class="caption mt-1">Overdue</div>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="head">
              <h4>Team</h4>
              <button class="btn btn-ghost btn-sm btn-icon"><Plus :size="14" /></button>
            </div>
            <div class="space-y-3">
              <div
                v-for="(member, i) in ['Alice', 'Bob', 'Carla']"
                :key="member"
                class="flex items-center gap-3"
              >
                <div class="avatar avatar-sm" :class="`tinted-${i + 1}`">{{ member[0] }}</div>
                <span class="text-sm font-medium">{{ member }}</span>
                <span class="tag pill neutral ml-auto" style="margin-left: auto">{{
                  ['Admin', 'Editor', 'Viewer'][i]
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Item List ─────────────────────────────────────── -->
      <section id="section-itemlist" class="mb-16 scroll-mt-6">
        <h2
          class="text-[11px] font-semibold uppercase tracking-[0.08em] text-3 mb-4 pb-2 border-b border-[var(--border-soft)]"
        >
          Item List
        </h2>
        <div class="space-y-2">
          <div
            class="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]"
          >
            <GripVertical :size="14" class="text-3 shrink-0 cursor-grab" />
            <div class="task-check shrink-0"></div>
            <div class="flex flex-col flex-1 min-w-0">
              <div class="text-sm font-medium text-1 truncate">Design homepage mockups</div>
              <div class="text-xs text-2">Due tomorrow</div>
            </div>
            <button class="btn btn-ghost btn-sm btn-icon shrink-0">
              <MoreHorizontal :size="16" />
            </button>
          </div>
          <div
            class="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]"
          >
            <GripVertical :size="14" class="text-3 shrink-0 cursor-grab" />
            <div class="task-check shrink-0"></div>
            <div class="flex flex-col flex-1 min-w-0">
              <div class="text-sm font-medium text-1 truncate">API rate-limit tests</div>
              <div class="text-xs text-2">Due in 3 days</div>
            </div>
            <button class="btn btn-ghost btn-sm btn-icon shrink-0">
              <MoreHorizontal :size="16" />
            </button>
          </div>
          <div
            class="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]"
          >
            <GripVertical :size="14" class="text-3 shrink-0 cursor-grab" />
            <div class="task-check done shrink-0"></div>
            <div class="flex flex-col flex-1 min-w-0">
              <div class="text-sm font-medium text-1 truncate line-through text-3">
                Update changelog
              </div>
              <div class="text-xs text-2">May 17, 2026</div>
            </div>
            <button class="btn btn-ghost btn-sm btn-icon shrink-0">
              <MoreHorizontal :size="16" />
            </button>
          </div>
        </div>
      </section>

      <!-- ── Item Grid ─────────────────────────────────────── -->
      <section id="section-itemgrid" class="mb-16 scroll-mt-6">
        <h2
          class="text-[11px] font-semibold uppercase tracking-[0.08em] text-3 mb-4 pb-2 border-b border-[var(--border-soft)]"
        >
          Item Grid
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div
            class="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] space-y-3"
          >
            <div class="flex items-start justify-between">
              <div
                class="h-10 w-10 rounded-lg bg-[var(--primary-bg)] flex items-center justify-center text-primary"
              >
                <FileText :size="18" />
              </div>
              <button class="btn btn-ghost btn-sm btn-icon"><MoreHorizontal :size="14" /></button>
            </div>
            <div>
              <div class="text-sm font-medium text-1">Q4 Roadmap</div>
              <div class="text-xs text-2 mt-0.5">Strategic planning document</div>
            </div>
            <div class="flex items-center gap-2 pt-2 border-t border-[var(--border-soft)]">
              <span class="tag pill success"><span class="dot"></span>Active</span>
              <span class="text-xs text-3 ml-auto">May 17</span>
            </div>
          </div>
          <div
            class="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] space-y-3"
          >
            <div class="flex items-start justify-between">
              <div
                class="h-10 w-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-accent"
              >
                <Star :size="18" />
              </div>
              <button class="btn btn-ghost btn-sm btn-icon"><MoreHorizontal :size="14" /></button>
            </div>
            <div>
              <div class="text-sm font-medium text-1">Design System</div>
              <div class="text-xs text-2 mt-0.5">Component library & tokens</div>
            </div>
            <div class="flex items-center gap-2 pt-2 border-t border-[var(--border-soft)]">
              <span class="tag pill warning"><span class="dot"></span>In review</span>
              <span class="text-xs text-3 ml-auto">May 19</span>
            </div>
          </div>
          <div
            class="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] space-y-3"
          >
            <div class="flex items-start justify-between">
              <div
                class="h-10 w-10 rounded-lg bg-[var(--success)]/10 flex items-center justify-center text-success"
              >
                <CheckCircle :size="18" />
              </div>
              <button class="btn btn-ghost btn-sm btn-icon"><MoreHorizontal :size="14" /></button>
            </div>
            <div>
              <div class="text-sm font-medium text-1">API v2 Spec</div>
              <div class="text-xs text-2 mt-0.5">Rate limits & endpoints</div>
            </div>
            <div class="flex items-center gap-2 pt-2 border-t border-[var(--border-soft)]">
              <span class="tag pill success"><span class="dot"></span>Done</span>
              <span class="text-xs text-3 ml-auto">May 15</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Tables ───────────────────────────────────────── -->
      <section id="section-tables" class="mb-16 scroll-mt-6">
        <h2
          class="text-[11px] font-semibold uppercase tracking-[0.08em] text-3 mb-4 pb-2 border-b border-[var(--border-soft)]"
        >
          Tables
        </h2>
        <div>
          <div class="card" style="padding: 0; overflow: hidden">
            <table class="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th class="actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in tableRows" :key="row.name">
                  <td>
                    <div class="flex items-center gap-2">
                      <div class="avatar avatar-sm tinted-1">{{ row.name[0] }}</div>
                      {{ row.name }}
                    </div>
                  </td>
                  <td>{{ row.role }}</td>
                  <td>
                    <span class="tag pill" :class="row.status === 'active' ? 'success' : 'neutral'">
                      <span class="dot"></span>{{ row.status }}
                    </span>
                  </td>
                  <td class="text-2">{{ row.date }}</td>
                  <td class="actions">
                    <div class="flex items-center gap-1">
                      <button class="btn btn-ghost btn-sm btn-icon">
                        <MoreHorizontal :size="14" />
                      </button>
                      <button class="btn btn-ghost btn-sm btn-icon text-danger hover:text-danger">
                        <Trash2 :size="14" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ── Tabs ─────────────────────────────────────────── -->
      <section id="section-tabs" class="mb-16 scroll-mt-6">
        <h2
          class="text-[11px] font-semibold uppercase tracking-[0.08em] text-3 mb-4 pb-2 border-b border-[var(--border-soft)]"
        >
          Tabs
        </h2>
        <div style="max-width: 480px">
          <div class="tabs">
            <button
              v-for="t in ['Overview', 'Tasks', 'Comments', 'Settings']"
              :key="t"
              class="tab"
              :class="{ active: activeTab === t.toLowerCase() }"
              @click="activeTab = t.toLowerCase()"
            >
              {{ t }}
            </button>
          </div>
          <div class="card mt-4 text-sm text-2">
            Active panel: <strong class="text-1">{{ activeTab }}</strong>
          </div>
        </div>
      </section>

      <!-- ── Menus ─────────────────────────────────────────── -->
      <section id="section-menus" class="mb-16 scroll-mt-6">
        <h2
          class="text-[11px] font-semibold uppercase tracking-[0.08em] text-3 mb-4 pb-2 border-b border-[var(--border-soft)]"
        >
          Menus
        </h2>
        <div>
          <div class="menu" style="display: inline-block">
            <button class="item"><Star :size="14" />Favourite<kbd class="kbd">⌘D</kbd></button>
            <button class="item"><FileText :size="14" />Duplicate</button>
            <button class="item"><Download :size="14" />Export</button>
            <div class="sep"></div>
            <button class="item danger"><Trash2 :size="14" />Delete<kbd class="kbd">⌫</kbd></button>
          </div>
        </div>
      </section>

      <!-- ── Modals ─────────────────────────────────────────── -->
      <section id="section-modals" class="mb-16 scroll-mt-6">
        <h2
          class="text-[11px] font-semibold uppercase tracking-[0.08em] text-3 mb-4 pb-2 border-b border-[var(--border-soft)]"
        >
          Modals
        </h2>
        <div>
          <button class="btn btn-secondary" @click="modalOpen = true">Open modal</button>
          <Modal title="Confirm deletion" :open="modalOpen" @close="modalOpen = false">
            <p class="text-sm text-2">
              This will permanently delete the project and all its tasks. This action cannot be
              undone.
            </p>
            <div class="message is-error mt-3 flex items-center gap-2">
              <AlertTriangle :size="14" />
              All 24 tasks will be removed.
            </div>
            <template #footer>
              <button class="btn btn-ghost" @click="modalOpen = false">Cancel</button>
              <button class="btn btn-danger" @click="modalOpen = false">
                <Trash2 :size="16" />Delete project
              </button>
            </template>
          </Modal>
        </div>
      </section>

      <!-- ── Toasts ─────────────────────────────────────────── -->
      <section id="section-toasts" class="mb-16 scroll-mt-6">
        <h2
          class="text-[11px] font-semibold uppercase tracking-[0.08em] text-3 mb-4 pb-2 border-b border-[var(--border-soft)]"
        >
          Toasts
        </h2>
        <div>
          <div class="flex flex-wrap gap-3">
            <button class="btn btn-secondary" @click="showToast('success')">
              <CheckCircle :size="16" class="text-success" />Success
            </button>
            <button class="btn btn-secondary" @click="showToast('error')">
              <AlertCircle :size="16" class="text-danger" />Error
            </button>
            <button class="btn btn-secondary" @click="showToast('warning')">
              <AlertTriangle :size="16" class="text-warning" />Warning
            </button>
            <button class="btn btn-secondary" @click="showToast('info')">
              <Info :size="16" class="text-info" />Info
            </button>
          </div>
        </div>
      </section>

      <!-- ── Empty states ──────────────────────────────────── -->
      <section id="section-empty" class="mb-16 scroll-mt-6">
        <h2
          class="text-[11px] font-semibold uppercase tracking-[0.08em] text-3 mb-4 pb-2 border-b border-[var(--border-soft)]"
        >
          Empty states
        </h2>
        <div class="grid grid-cols-2 max-lg:grid-cols-1 gap-4" style="max-width: 640px">
          <div class="card">
            <div class="empty">
              <div class="ic"><Inbox :size="20" /></div>
              <div class="t">No tasks yet</div>
              <div class="s">Create your first task to get started with Nova.</div>
              <button class="btn btn-soft btn-sm mt-2"><Plus :size="14" />New task</button>
            </div>
          </div>
          <div class="card">
            <div class="empty">
              <div class="ic"><Bell :size="20" /></div>
              <div class="t">All caught up</div>
              <div class="s">You have no new notifications right now.</div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── AI card ───────────────────────────────────────── -->
      <section id="section-ai" class="mb-16 scroll-mt-6">
        <h2
          class="text-[11px] font-semibold uppercase tracking-[0.08em] text-3 mb-4 pb-2 border-b border-[var(--border-soft)]"
        >
          AI card
        </h2>
        <div style="max-width: 520px">
          <div class="ai-card">
            <div class="ic"><Sparkles :size="18" /></div>
            <div class="body">
              <div class="t">Suggest subtasks with AI</div>
              <div class="s">Generated based on this task's title and description.</div>
            </div>
            <button class="btn btn-primary btn-sm"><Sparkles :size="14" />Generate</button>
          </div>
        </div>
      </section>

      <!-- ── Progress ──────────────────────────────────────── -->
      <section id="section-progress" class="mb-16 scroll-mt-6">
        <h2
          class="text-[11px] font-semibold uppercase tracking-[0.08em] text-3 mb-4 pb-2 border-b border-[var(--border-soft)]"
        >
          Progress
        </h2>
        <div class="space-y-4" style="max-width: 400px">
          <div>
            <div class="flex justify-between mb-2">
              <span class="text-sm">Primary ({{ progressVal }}%)</span>
              <button
                class="btn btn-ghost btn-sm btn-icon"
                @click="progressVal = Math.min(100, progressVal + 10)"
              >
                <Plus :size="12" />
              </button>
            </div>
            <div class="progress">
              <div class="bar" :style="{ width: progressVal + '%' }"></div>
            </div>
          </div>
          <div>
            <span class="text-sm mb-2 block">Success</span>
            <div class="progress"><div class="bar success" style="width: 82%"></div></div>
          </div>
          <div>
            <span class="text-sm mb-2 block">Warning</span>
            <div class="progress"><div class="bar warning" style="width: 45%"></div></div>
          </div>
          <div>
            <span class="text-sm mb-2 block">Danger</span>
            <div class="progress"><div class="bar danger" style="width: 28%"></div></div>
          </div>
        </div>
      </section>

      <!-- ── Shadows ────────────────────────────────────────── -->
      <section id="section-shadows" class="mb-16 scroll-mt-6">
        <h2
          class="text-[11px] font-semibold uppercase tracking-[0.08em] text-3 mb-4 pb-2 border-b border-[var(--border-soft)]"
        >
          Shadows &amp; tokens
        </h2>
        <div>
          <p class="text-sm text-2 mb-6">
            Shadows are only used on <em>floating</em> overlays. Cards and rows stay flat with
            borders.
          </p>
          <div class="flex gap-6 flex-wrap items-start">
            <div
              class="w-[120px] h-20 rounded-lg bg-[var(--bg-surface)] flex flex-col items-center justify-center gap-1"
              style="box-shadow: var(--shadow-1)"
            >
              <span class="caption">shadow-1</span>
              <span class="mono text-xs mt-1">Subtle lift</span>
            </div>
            <div
              class="w-[120px] h-20 rounded-lg bg-[var(--bg-surface)] flex flex-col items-center justify-center gap-1"
              style="box-shadow: var(--shadow-2)"
            >
              <span class="caption">shadow-2</span>
              <span class="mono text-xs mt-1">Hover / FAB</span>
            </div>
            <div
              class="w-[120px] h-20 rounded-lg bg-[var(--bg-surface)] flex flex-col items-center justify-center gap-1"
              style="box-shadow: var(--shadow-3)"
            >
              <span class="caption">shadow-3</span>
              <span class="mono text-xs mt-1">Modal / menu</span>
            </div>
          </div>
        </div>
      </section>
    </PageShell>

    <Toast ref="toastRef" />
  </div>
</template>
