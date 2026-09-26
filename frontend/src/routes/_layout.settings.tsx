import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Settings as SettingsIcon, Save, Info, Sun, Moon, Monitor,
  Type, Contrast, Zap,
} from 'lucide-react'
import { useTheme } from '@/context/theme-provider'
import { useAccessibility, type TextSize } from '@/context/accessibility-provider'
import { useI18n, type LangCode } from '@/i18n'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export const Route = createFileRoute('/_layout/settings')({
  component: SettingsPage,
})

/* ── Reusable icon-button picker ──────────────────────────────────────────── */
function PickerButton({
  value, current, icon: Icon, label, onClick,
}: {
  value: string; current: string; icon: React.ElementType; label: string; onClick: () => void
}) {
  const active = current === value
  return (
    <button
      type='button'
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex flex-col items-center gap-1.5 p-3 rounded-sm border cursor-pointer',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        active
          ? 'border-[var(--violet-border)] bg-[var(--violet-surface)] text-[var(--violet-deep)]'
          : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground',
      )}
    >
      <Icon className='size-5' aria-hidden='true' />
      <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.875rem', fontWeight: 500 }}>
        {label}
      </span>
    </button>
  )
}

/* ── Settings toggle row ─────────────────────────────────────────────────── */
function SettingRow({
  icon: Icon, title, desc, checked, onChange, iconColor = 'text-muted-foreground/70',
}: {
  icon: React.ElementType; title: string; desc: string
  checked: boolean; onChange: (v: boolean) => void; iconColor?: string
}) {
  return (
    <div className='flex items-center justify-between py-4 gap-4'>
      <div className='flex items-start gap-3'>
        <Icon className={cn('size-4 shrink-0 mt-0.5', iconColor)} aria-hidden='true' />
        <div>
          <p className='font-medium' style={{ fontSize: '0.9375rem' }}>{title}</p>
          <p className='text-muted-foreground mt-0.5' style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>{desc}</p>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className='shrink-0'
        aria-label={title}
      />
    </div>
  )
}

/* ── Main page ───────────────────────────────────────────────────────────── */
function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { lang, setLang, t, languages } = useI18n()
  const {
    textSize, setTextSize,
    highContrast, setHighContrast,
    reducedMotion, setReducedMotion,
  } = useAccessibility()

  // Controlled general form state
  const [resortName, setResortName]   = useState('Smart Resort 360')
  const [primaryLang, setPrimaryLang] = useState('en')
  const [timezone, setTimezone]       = useState('ist')
  const [isDirty, setIsDirty]         = useState(false)

  // Notification toggles (local state — no backend)
  const [notifSLA,    setNotifSLA]    = useState(true)
  const [notifAI,     setNotifAI]     = useState(true)
  const [notifDigest, setNotifDigest] = useState(false)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setIsDirty(false)
    toast.success('Settings saved', {
      description: `Resort name: "${resortName}" · Language: ${primaryLang.toUpperCase()} · Timezone: ${timezone.toUpperCase()}`,
    })
  }

  const textSizeOptions: { value: TextSize; label: string }[] = [
    { value: 'default', label: 'Default' },
    { value: 'large',   label: 'Large' },
    { value: 'xl',      label: 'Extra Large' },
  ]

  return (
    <div className='px-8 py-8 space-y-8 max-w-3xl min-h-screen'>

      <div>
        <h1 className='font-semibold tracking-tight leading-tight' style={{ fontSize: 'var(--text-3xl)' }}>
          {t('settings.title')}
        </h1>
        <p className='mt-1 text-muted-foreground' style={{ fontSize: '0.9375rem' }}>
          {t('settings.subtitle')}
        </p>
      </div>

      <div className='space-y-6'>

        {/* ── Appearance ───────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className='text-[1.0625rem]'>{t('settings.appearanceTitle')}</CardTitle>
            <CardDescription>{t('settings.appearanceDesc')}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>

            {/* Theme */}
            <div className='space-y-2'>
              <label className='font-medium' style={{ fontSize: '0.9375rem' }}>{t('settings.theme')}</label>
              <div className='grid grid-cols-3 gap-3 max-w-xs'>
                <PickerButton value='light'  current={theme} icon={Sun}     label={t('settings.themeLight')}  onClick={() => setTheme('light')} />
                <PickerButton value='dark'   current={theme} icon={Moon}    label={t('settings.themeDark')}   onClick={() => setTheme('dark')} />
                <PickerButton value='system' current={theme} icon={Monitor} label={t('settings.themeSystem')} onClick={() => setTheme('system')} />
              </div>
            </div>

            {/* Language */}
            <div className='space-y-2'>
              <label htmlFor='interface-lang' className='font-medium' style={{ fontSize: '0.9375rem' }}>
                {t('settings.interfaceLanguage')}
              </label>
              <Select value={lang} onValueChange={(v) => setLang(v as LangCode)}>
                <SelectTrigger id='interface-lang' className='rounded-sm max-w-xs' aria-label={t('settings.interfaceLanguage')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(languages) as [LangCode, string][]).map(([code, name]) => (
                    <SelectItem key={code} value={code}
                      style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9375rem' }}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ── Accessibility ─────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-[1.0625rem]'>
              <Contrast className='size-4' style={{ color: 'var(--violet-fg)' }} aria-hidden='true' />
              Accessibility
            </CardTitle>
            <CardDescription>Adjust text size, contrast, and motion preferences.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-0 divide-y divide-border'>

            {/* Text size */}
            <div className='py-4'>
              <div className='flex items-start gap-3 mb-3'>
                <Type className='size-4 shrink-0 mt-0.5 text-muted-foreground/70' aria-hidden='true' />
                <div>
                  <p className='font-medium' style={{ fontSize: '0.9375rem' }}>Text Size</p>
                  <p className='text-muted-foreground mt-0.5' style={{ fontSize: '0.875rem' }}>
                    Scale interface text for improved readability.
                  </p>
                </div>
              </div>
              <div className='grid grid-cols-3 gap-2 max-w-xs ml-7'>
                {textSizeOptions.map(({ value, label }) => (
                  <PickerButton
                    key={value}
                    value={value}
                    current={textSize}
                    icon={Type}
                    label={label}
                    onClick={() => setTextSize(value)}
                  />
                ))}
              </div>
            </div>

            {/* High Contrast */}
            <SettingRow
              icon={Contrast}
              iconColor='text-[var(--violet-fg)]'
              title='High Contrast'
              desc='Strengthen borders and text contrast for improved visibility.'
              checked={highContrast}
              onChange={setHighContrast}
            />

            {/* Reduced Motion */}
            <SettingRow
              icon={Zap}
              title='Reduce Motion'
              desc='Minimise animations and transitions throughout the interface.'
              checked={reducedMotion}
              onChange={setReducedMotion}
            />
          </CardContent>
        </Card>

        {/* ── General Configuration ─────────────────────── */}
        <Card>
          <form onSubmit={handleSave}>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-[1.0625rem]'>
                <SettingsIcon className='size-4 text-muted-foreground/70' aria-hidden='true' />
                {t('settings.generalTitle')}
              </CardTitle>
              <CardDescription>{t('settings.generalDesc')}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-5'>
              <div className='space-y-1.5'>
                <label htmlFor='resort-name' className='font-medium' style={{ fontSize: '0.9375rem' }}>
                  {t('settings.resortName')}
                </label>
                <Input
                  id='resort-name'
                  value={resortName}
                  onChange={(e) => { setResortName(e.target.value); setIsDirty(true) }}
                  aria-label={t('settings.resortName')}
                />
              </div>
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='space-y-1.5'>
                  <label htmlFor='primary-lang' className='font-medium' style={{ fontSize: '0.9375rem' }}>
                    {t('settings.primaryLanguage')}
                  </label>
                  <Select value={primaryLang} onValueChange={(v) => { setPrimaryLang(v); setIsDirty(true) }}>
                    <SelectTrigger id='primary-lang' className='rounded-sm'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='en' style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9375rem' }}>English</SelectItem>
                      <SelectItem value='hi' style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9375rem' }}>हिन्दी</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-1.5'>
                  <label htmlFor='timezone' className='font-medium' style={{ fontSize: '0.9375rem' }}>
                    {t('settings.timezone')}
                  </label>
                  <Select value={timezone} onValueChange={(v) => { setTimezone(v); setIsDirty(true) }}>
                    <SelectTrigger id='timezone' className='rounded-sm'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='ist' style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9375rem' }}>India Standard Time (IST)</SelectItem>
                      <SelectItem value='utc' style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9375rem' }}>UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className='border-t pt-4 gap-3'>
              <Button type='submit' aria-label={t('action.save')}>
                <Save className='size-4' aria-hidden='true' /> {t('action.save')}
              </Button>
              {isDirty && (
                <span className='text-[0.8125rem] text-muted-foreground italic'>Unsaved changes</span>
              )}
            </CardFooter>
          </form>
        </Card>

        {/* ── Notifications ─────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className='text-[1.0625rem]'>{t('settings.notifTitle')}</CardTitle>
            <CardDescription>{t('settings.notifDesc')}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-0 divide-y divide-border'>
            <SettingRow
              icon={SettingsIcon}
              title={t('settings.notifSLA')}
              desc={t('settings.notifSLADesc')}
              checked={notifSLA}
              onChange={(v) => { setNotifSLA(v); toast.info(v ? 'SLA alerts enabled' : 'SLA alerts disabled') }}
            />
            <SettingRow
              icon={SettingsIcon}
              title={t('settings.notifAI')}
              desc={t('settings.notifAIDesc')}
              checked={notifAI}
              onChange={(v) => { setNotifAI(v); toast.info(v ? 'AI alerts enabled' : 'AI alerts disabled') }}
            />
            <SettingRow
              icon={SettingsIcon}
              title={t('settings.notifDigest')}
              desc={t('settings.notifDigestDesc')}
              checked={notifDigest}
              onChange={(v) => { setNotifDigest(v); toast.info(v ? 'Daily digest enabled' : 'Daily digest disabled') }}
            />
          </CardContent>
        </Card>

        {/* ── Hackathon notice ──────────────────────────── */}
        <Card style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2'
              style={{ fontSize: '0.9375rem', color: 'var(--foreground)' }}>
              <Info className='size-4 text-muted-foreground/70' aria-hidden='true' />
              {t('settings.hackathonTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground' style={{ fontSize: '0.9375rem', lineHeight: '1.65' }}>
              The application is currently running in{' '}
              <strong className='font-semibold text-foreground'>{t('settings.demoMode')}</strong>.{' '}
              Data presented on the dashboard, insights, and pricing pages is seeded for
              demonstration purposes. Backend integration and live AI models are pending Phase 2.
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
