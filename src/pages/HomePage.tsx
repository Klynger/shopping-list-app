import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'

import * as api from '../api/endpoints.ts'
import { Button, EmptyState, ErrorText, Loading, TextField } from '../components/ui.tsx'
import { useI18n } from '../i18n/useI18n.ts'

export function HomePage() {
  return (
    <div className="page">
      <PendingInvites />
      <GroupsSection />
    </div>
  )
}

function PendingInvites() {
  const { t, formatError } = useI18n()
  const queryClient = useQueryClient()
  const invites = useQuery({ queryKey: api.queryKeys.myInvites, queryFn: api.listMyInvites })
  const accept = useMutation({
    mutationFn: (groupId: string) => api.acceptInvite(groupId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.queryKeys.myInvites })
      void queryClient.invalidateQueries({ queryKey: api.queryKeys.groups })
    },
  })

  if (!invites.data?.length && !invites.error) return null

  return (
    <section className="section">
      <h2>{t.home.invites}</h2>
      <ErrorText error={invites.error ? formatError(invites.error) : null} />
      <ul className="stack">
        {invites.data?.map((invite) => (
          <li key={invite.id} className="card row invite-card">
            <div>
              <strong>{invite.groupName}</strong>
              <p className="muted">{t.home.invitedBy(invite.senderUsername)}</p>
            </div>
            <Button
              size="sm"
              disabled={accept.isPending && accept.variables === invite.groupId}
              onClick={() => accept.mutate(invite.groupId)}
            >
              {t.home.joinGroup}
            </Button>
          </li>
        ))}
      </ul>
      <ErrorText error={accept.error ? formatError(accept.error) : null} />
    </section>
  )
}

function GroupsSection() {
  const { t, formatError } = useI18n()
  const groups = useQuery({ queryKey: api.queryKeys.groups, queryFn: api.listGroups })

  return (
    <section className="section">
      <div className="section-header">
        <h2>{t.home.yourGroups}</h2>
      </div>
      {groups.isPending ? <Loading label={t.common.loading} /> : null}
      <ErrorText error={groups.error ? formatError(groups.error) : null} />
      {groups.data && groups.data.length === 0 ? (
        <EmptyState>{t.home.noGroups}</EmptyState>
      ) : null}
      <ul className="stack">
        {groups.data?.map((group) => (
          <li key={group.groupId}>
            <Link to={`/groups/${group.groupId}`} className="card card-link">
              <span className="card-link-title">{group.groupName}</span>
              {group.roles.includes('owner') ? <span className="badge">{t.common.owner}</span> : null}
              <span className="card-link-arrow" aria-hidden="true">
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <CreateGroupForm />
    </section>
  )
}

function CreateGroupForm() {
  const { t, formatError } = useI18n()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const create = useMutation({
    mutationFn: (groupName: string) => api.createGroup(groupName),
    onSuccess: async ({ groupId }) => {
      setName('')
      await queryClient.invalidateQueries({ queryKey: api.queryKeys.groups })
      navigate(`/groups/${groupId}`)
    },
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (trimmed) create.mutate(trimmed)
  }

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <TextField label={t.home.newGroupLabel} hideLabel placeholder={t.home.newGroupPlaceholder} value={name} onChange={setName} />
      <Button type="submit" disabled={create.isPending || !name.trim()}>
        {t.home.createGroup}
      </Button>
      <ErrorText error={create.error ? formatError(create.error) : null} />
    </form>
  )
}
