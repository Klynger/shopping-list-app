import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useIntl } from 'react-intl'

import * as api from '../api/endpoints.ts'
import { Button, EmptyState, ErrorText, Loading, TextField } from '../components/ui.tsx'
import { useFormatError } from '../i18n/useFormatError.ts'

export function HomePage() {
  return (
    <div className="page">
      <PendingInvites />
      <GroupsSection />
    </div>
  )
}

function PendingInvites() {
  const { formatMessage } = useIntl()
  const formatError = useFormatError()
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
      <h2>{formatMessage({ id: 'home.invites' })}</h2>
      <ErrorText error={invites.error ? formatError(invites.error) : null} />
      <ul className="stack">
        {invites.data?.map((invite) => (
          <li key={invite.id} className="card row invite-card">
            <div>
              <strong>{invite.groupName}</strong>
              <p className="muted">{formatMessage({ id: 'home.invitedBy' }, { username: invite.senderUsername })}</p>
            </div>
            <Button
              size="sm"
              disabled={accept.isPending && accept.variables === invite.groupId}
              onClick={() => accept.mutate(invite.groupId)}
            >
              {formatMessage({ id: 'home.joinGroup' })}
            </Button>
          </li>
        ))}
      </ul>
      <ErrorText error={accept.error ? formatError(accept.error) : null} />
    </section>
  )
}

function GroupsSection() {
  const { formatMessage } = useIntl()
  const formatError = useFormatError()
  const groups = useQuery({ queryKey: api.queryKeys.groups, queryFn: api.listGroups })

  return (
    <section className="section">
      <div className="section-header">
        <h2>{formatMessage({ id: 'home.yourGroups' })}</h2>
      </div>
      {groups.isPending ? <Loading label={formatMessage({ id: 'common.loading' })} /> : null}
      <ErrorText error={groups.error ? formatError(groups.error) : null} />
      {groups.data && groups.data.length === 0 ? (
        <EmptyState>{formatMessage({ id: 'home.noGroups' })}</EmptyState>
      ) : null}
      <ul className="stack">
        {groups.data?.map((group) => (
          <li key={group.groupId}>
            <Link to={`/groups/${group.groupId}`} className="card card-link">
              <span className="card-link-title">{group.groupName}</span>
              {group.roles.includes('owner') ? <span className="badge">{formatMessage({ id: 'common.owner' })}</span> : null}
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
  const { formatMessage } = useIntl()
  const formatError = useFormatError()
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
      <TextField label={formatMessage({ id: 'home.newGroup.label' })} hideLabel placeholder={formatMessage({ id: 'home.newGroup.placeholder' })} value={name} onChange={setName} />
      <Button type="submit" disabled={create.isPending || !name.trim()}>
        {formatMessage({ id: 'home.createGroup' })}
      </Button>
      <ErrorText error={create.error ? formatError(create.error) : null} />
    </form>
  )
}
