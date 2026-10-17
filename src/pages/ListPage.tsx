import { Menu } from '@base-ui/react/menu'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'

import * as api from '../api/endpoints.ts'
import { Button, EmptyState, ErrorText, Loading, Modal, Select, TextField } from '../components/ui.tsx'
import { useI18n } from '../i18n/useI18n.ts'

export function ListPage() {
  const { t } = useI18n()
  const { groupId = '', listId = '' } = useParams()
  const groups = useQuery({ queryKey: api.queryKeys.groups, queryFn: api.listGroups })
  const lists = useQuery({ queryKey: api.queryKeys.groupLists(groupId), queryFn: () => api.listGroupLists(groupId) })
  const group = groups.data?.find((candidate) => candidate.groupId === groupId)
  const list = lists.data?.find((candidate) => candidate.id === listId)

  if (lists.isPending) return <Loading label={t.common.loading} />

  const backLink = (
    <Link to={`/groups/${groupId}`} className="back-link">
      ‹ {group?.groupName ?? t.list.groupFallback}
    </Link>
  )

  if (!list) {
    return (
      <div className="page">
        {backLink}
        <EmptyState>{t.list.notFound}</EmptyState>
      </div>
    )
  }

  return (
    <div className="page page-with-bar">
      {backLink}
      <ListHeader list={list} />
      <Items listId={listId} />
    </div>
  )
}

function ListHeader({ list }: { list: api.ShoppingList }) {
  const { t, formatError } = useI18n()
  const queryClient = useQueryClient()
  const updateStatus = useMutation({
    mutationFn: (status: api.ListStatus) => api.updateListStatus(list.id, status),
    onSettled: () => queryClient.invalidateQueries({ queryKey: api.queryKeys.groupLists(list.groupId) }),
  })
  const options = listStatuses.map((status) => ({ value: status, label: t.listStatus[status] }))

  return (
    <div className="list-header">
      <h1 className="page-title">{list.name}</h1>
      <Select
        label={t.list.statusLabel}
        hideLabel
        size="sm"
        value={updateStatus.isPending ? updateStatus.variables : list.status}
        options={options}
        onChange={(status) => updateStatus.mutate(status)}
      />
      <ErrorText error={updateStatus.error ? formatError(updateStatus.error) : null} />
    </div>
  )
}

function Items({ listId }: { listId: string }) {
  const { t, formatError } = useI18n()
  const items = useQuery({ queryKey: api.queryKeys.listItems(listId), queryFn: () => api.listItems(listId) })
  const products = useQuery({ queryKey: api.queryKeys.products, queryFn: api.listProducts })
  const [adding, setAdding] = useState(false)

  const productUnits = new Map(products.data?.map((product) => [product.id, product.predefinedUnit]))
  const remaining = items.data?.filter((item) => item.status === 'pending' || item.status === 'in_cart') ?? []
  const done = items.data?.filter((item) => item.status === 'purchased' || item.status === 'cancelled') ?? []

  return (
    <>
      <section className="section">
        <h2>
          {t.list.remaining} <span className="count">{remaining.length}</span>
        </h2>
        {items.isPending ? <Loading label={t.common.loading} /> : null}
        <ErrorText error={items.error ? formatError(items.error) : null} />
        {items.data && items.data.length === 0 ? <EmptyState>{t.list.empty}</EmptyState> : null}
        {items.data && items.data.length > 0 && remaining.length === 0 ? <EmptyState>{t.list.allDone}</EmptyState> : null}
        <ItemList listId={listId} items={remaining} productUnits={productUnits} />
      </section>

      {done.length > 0 ? (
        <section className="section">
          <h2>
            {t.list.done} <span className="count">{done.length}</span>
          </h2>
          <ItemList listId={listId} items={done} productUnits={productUnits} />
        </section>
      ) : null}

      <div className="bottom-bar">
        <Button className="bottom-bar-button" onClick={() => setAdding(true)}>
          <PlusIcon />
          {t.list.addItems}
        </Button>
      </div>

      <AddItemsSheet
        listId={listId}
        open={adding}
        onOpenChange={setAdding}
        items={items.data ?? []}
        products={products.data ?? []}
      />
    </>
  )
}

function ItemList({
  listId,
  items,
  productUnits,
}: {
  listId: string
  items: api.ListItem[]
  productUnits: Map<string, string>
}) {
  if (items.length === 0) return null

  return (
    <ul className="card item-list">
      {items.map((item) => (
        <ItemRow key={item.id} listId={listId} item={item} unit={item.unit || productUnits.get(item.productId) || ''} />
      ))}
    </ul>
  )
}

function ItemRow({ listId, item, unit }: { listId: string; item: api.ListItem; unit: string }) {
  const { t, formatError } = useI18n()
  const action = useItemAction(listId)
  const [editing, setEditing] = useState(false)
  const isBought = item.status === 'purchased'
  const showStatus = item.status === 'in_cart' || item.status === 'cancelled'

  function setStatus(status: api.ItemStatus) {
    action.mutate({
      itemId: item.id,
      run: () => api.updateItemStatus(listId, item.id, status),
      optimistic: (current) => ({ ...current, status }),
    })
  }

  return (
    <li className={`item-row item-${item.status}`}>
      <button
        type="button"
        className="item-check"
        aria-pressed={isBought}
        aria-label={isBought ? t.list.markNotBought(item.productName) : t.list.markBought(item.productName)}
        onClick={() => setStatus(isBought ? 'pending' : 'purchased')}
      >
        <span className="item-check-circle">{isBought ? <CheckIcon size={14} /> : null}</span>
      </button>

      <div className="item-main">
        <span className="item-name">{item.productName}</span>
        {item.note || showStatus ? (
          <span className="item-meta">
            {showStatus ? <span className={`badge badge-item-${item.status}`}>{t.itemStatus[item.status]}</span> : null}
            {item.note ? <span className="item-note">{item.note}</span> : null}
          </span>
        ) : null}
      </div>

      <div className="stepper" role="group" aria-label={t.list.quantityOf(item.productName)}>
        <button
          type="button"
          className="stepper-button"
          aria-label={t.list.decrease}
          disabled={item.quantity <= 1}
          onClick={() =>
            action.mutate({
              itemId: item.id,
              run: () => api.decrementItem(listId, item.id),
              optimistic: (current) => ({ ...current, quantity: Math.max(1, current.quantity - 1) }),
            })
          }
        >
          <MinusIcon />
        </button>
        <span className="stepper-value">
          {item.quantity}
          {unit ? <span className="stepper-unit">{unit}</span> : null}
        </span>
        <button
          type="button"
          className="stepper-button"
          aria-label={t.list.increase}
          onClick={() =>
            action.mutate({
              itemId: item.id,
              run: () => api.incrementItem(listId, item.id),
              optimistic: (current) => ({ ...current, quantity: current.quantity + 1 }),
            })
          }
        >
          <PlusIcon />
        </button>
      </div>

      <ItemMenu
        item={item}
        onStatusChange={setStatus}
        onEdit={() => setEditing(true)}
        onRemove={() => action.mutate({ itemId: item.id, run: () => api.deleteItem(listId, item.id), optimistic: () => null })}
      />

      {action.error ? (
        <div className="item-error">
          <ErrorText error={formatError(action.error)} />
        </div>
      ) : null}

      <EditItemModal listId={listId} item={item} open={editing} onOpenChange={setEditing} />
    </li>
  )
}

function ItemMenu({
  item,
  onStatusChange,
  onEdit,
  onRemove,
}: {
  item: api.ListItem
  onStatusChange: (status: api.ItemStatus) => void
  onEdit: () => void
  onRemove: () => void
}) {
  const { t } = useI18n()

  return (
    <Menu.Root>
      <Menu.Trigger className="icon-button" aria-label={t.list.itemActions(item.productName)}>
        <MoreIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="menu-positioner" align="end" sideOffset={4}>
          <Menu.Popup className="menu-popup">
            <Menu.Group>
              <Menu.GroupLabel className="menu-group-label">{t.list.status}</Menu.GroupLabel>
              <Menu.RadioGroup
                value={item.status}
                onValueChange={(status: api.ItemStatus) => {
                  if (status !== item.status) onStatusChange(status)
                }}
              >
                {itemStatuses.map((status) => (
                  <Menu.RadioItem key={status} value={status} className="menu-item" closeOnClick>
                    <Menu.RadioItemIndicator className="menu-indicator" keepMounted>
                      <CheckIcon size={12} />
                    </Menu.RadioItemIndicator>
                    <span>{t.itemStatus[status]}</span>
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>
            </Menu.Group>
            <div className="menu-separator" role="separator" />
            <Menu.Item className="menu-item" onClick={onEdit}>
              <span className="menu-indicator" />
              <span>{t.list.editDetails}</span>
            </Menu.Item>
            <Menu.Item className="menu-item menu-item-danger" onClick={onRemove}>
              <span className="menu-indicator" />
              <span>{t.list.remove}</span>
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}

function EditItemModal({
  listId,
  item,
  open,
  onOpenChange,
}: {
  listId: string
  item: api.ListItem
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t, formatError } = useI18n()
  const queryClient = useQueryClient()
  const [quantity, setQuantity] = useState(String(item.quantity))
  const [unit, setUnit] = useState(item.unit)
  const [note, setNote] = useState(item.note)
  const save = useMutation({
    mutationFn: () => api.updateItem(listId, item.id, { quantity: Number(quantity), unit: unit.trim(), note: note.trim() }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: api.queryKeys.listItems(listId) })
      onOpenChange(false)
    },
  })

  function handleOpenChange(next: boolean) {
    if (next) {
      setQuantity(String(item.quantity))
      setUnit(item.unit)
      setNote(item.note)
      save.reset()
    }
    onOpenChange(next)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    save.mutate()
  }

  return (
    <Modal open={open} onOpenChange={handleOpenChange} title={t.list.editTitle(item.productName)}>
      <form className="stack" onSubmit={handleSubmit}>
        <div className="field-row">
          <TextField label={t.list.quantity} type="number" min={1} value={quantity} onChange={setQuantity} required />
          <TextField label={t.list.unit} placeholder={t.list.unitPlaceholder} value={unit} onChange={setUnit} />
        </div>
        <TextField label={t.list.note} placeholder={t.list.notePlaceholder} value={note} onChange={setNote} />
        <ErrorText error={save.error ? formatError(save.error) : null} />
        <div className="dialog-actions">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button type="submit" disabled={save.isPending || Number(quantity) < 1}>
            {t.common.save}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

/**
 * The quick-add flow: search the shared catalog and tap a product to put it on
 * the list, or create a product from the search text when nothing matches.
 */
function AddItemsSheet({
  listId,
  open,
  onOpenChange,
  items,
  products,
}: {
  listId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  items: api.ListItem[]
  products: api.Product[]
}) {
  const { t, formatError } = useI18n()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [justAdded, setJustAdded] = useState<string | null>(null)

  const onList = new Set(items.map((item) => item.productId))
  const trimmed = query.trim()
  const needle = normalize(trimmed)
  // Products that can still be added come first, then closer name matches.
  const matches = products
    .filter((product) => normalize(product.name).includes(needle))
    .sort(
      (a, b) =>
        Number(onList.has(a.id)) - Number(onList.has(b.id)) ||
        rank(a.name, needle) - rank(b.name, needle) ||
        a.name.localeCompare(b.name),
    )
  const exactMatch = products.some((product) => normalize(product.name) === needle)
  const canCreate = trimmed !== '' && !exactMatch

  const add = useMutation({
    mutationFn: async (target: { productId: string } | { newProductName: string }) => {
      let productId: string
      if ('productId' in target) {
        productId = target.productId
      } else {
        await api.createProduct({ name: target.newProductName, description: '', predefinedUnit: '' })
        // Creating a product returns no body, so find the new one in a fresh catalog.
        const fresh = await queryClient.fetchQuery({ queryKey: api.queryKeys.products, queryFn: api.listProducts, staleTime: 0 })
        const created = fresh.findLast((product) => product.name === target.newProductName && !onList.has(product.id))
        if (!created) throw new Error('created product not found')
        productId = created.id
      }
      await api.addItem(listId, { productId })
      return productId
    },
    onSuccess: async (productId) => {
      setJustAdded(productId)
      setQuery('')
      inputRef.current?.focus()
      await queryClient.invalidateQueries({ queryKey: api.queryKeys.listItems(listId) })
    },
  })

  function handleOpenChange(next: boolean) {
    if (next) {
      setQuery('')
      setJustAdded(null)
      add.reset()
    }
    onOpenChange(next)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!trimmed || add.isPending) return
    // Enter takes the best addable match, and only creates a product when nothing matches.
    const first = matches.find((product) => !onList.has(product.id))
    if (first) {
      add.mutate({ productId: first.id })
    } else if (canCreate) {
      add.mutate({ newProductName: trimmed })
    }
  }

  return (
    <Modal open={open} onOpenChange={handleOpenChange} title={t.list.sheetTitle} className="sheet-tall">
      <form className="sheet-search" onSubmit={handleSubmit}>
        <label className="visually-hidden" htmlFor="add-items-search">
          {t.list.searchLabel}
        </label>
        <SearchIcon />
        <input
          id="add-items-search"
          ref={inputRef}
          className="input sheet-search-input"
          type="search"
          enterKeyHint="go"
          autoComplete="off"
          placeholder={t.list.searchPlaceholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setJustAdded(null)
          }}
        />
      </form>

      <ErrorText error={add.error ? formatError(add.error) : null} />

      <ul className="product-results">
        {matches.map((product) => {
          const alreadyOnList = onList.has(product.id)
          return (
            <li key={product.id}>
              <button
                type="button"
                className="product-result"
                disabled={alreadyOnList || add.isPending}
                onClick={() => add.mutate({ productId: product.id })}
              >
                <span className="product-result-name">
                  {product.name}
                  {product.predefinedUnit ? <span className="muted"> · {product.predefinedUnit}</span> : null}
                </span>
                {alreadyOnList ? (
                  <span className={justAdded === product.id ? 'product-result-state added' : 'product-result-state'}>
                    {justAdded === product.id ? t.list.added : t.list.onList}
                  </span>
                ) : (
                  <span className="product-result-add" aria-hidden="true">
                    <PlusIcon />
                  </span>
                )}
              </button>
            </li>
          )
        })}
        {canCreate ? (
          <li>
            <button
              type="button"
              className="product-result product-result-create"
              disabled={add.isPending}
              onClick={() => add.mutate({ newProductName: trimmed })}
            >
              <PlusIcon />
              <span>{t.list.createAndAdd(trimmed)}</span>
            </button>
          </li>
        ) : null}
      </ul>

      {products.length === 0 && !trimmed ? <EmptyState>{t.list.noProducts}</EmptyState> : null}
      {products.length > 0 && matches.length === 0 && !trimmed ? <EmptyState>{t.list.noMatches}</EmptyState> : null}

      <div className="dialog-actions">
        <Button variant="secondary" onClick={() => onOpenChange(false)}>
          {t.list.closeSheet}
        </Button>
      </div>
    </Modal>
  )
}

/**
 * Runs one item operation, showing its result in the list right away and
 * rolling back if the server refuses. Taps can overlap (pressing + three times
 * fast), so the list is re-read from the server only once the last one settles.
 */
function useItemAction(listId: string) {
  const queryClient = useQueryClient()
  const queryKey = api.queryKeys.listItems(listId)
  const mutationKey = ['item-action', listId]

  return useMutation({
    mutationKey,
    mutationFn: (action: ItemAction) => action.run(),
    onMutate: (action) => {
      // Cancelling happens synchronously; not awaiting it lets the new value
      // paint on the same frame as the tap.
      void queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<api.ListItem[]>(queryKey)
      queryClient.setQueryData<api.ListItem[]>(queryKey, (items) =>
        items?.flatMap((item) => {
          if (item.id !== action.itemId) return [item]
          const next = action.optimistic(item)
          return next ? [next] : []
        }),
      )
      return { previous }
    },
    onError: (_error, _action, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
    },
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey }) <= 1) {
        return queryClient.invalidateQueries({ queryKey })
      }
    },
  })
}

const listStatuses: api.ListStatus[] = ['planning', 'active', 'completed']

const itemStatuses: api.ItemStatus[] = ['pending', 'in_cart', 'purchased', 'cancelled']

/**
 * Lowercases and strips accents so "acucar" finds "Açúcar".
 */
function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

function rank(name: string, needle: string) {
  return normalize(name).startsWith(needle) ? 0 : 1
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 3v10M3 8h10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function MinusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8h10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true">
      <path d="m2.5 6.5 2.5 2.5 4.5-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="4" cy="9" r="1.5" fill="currentColor" />
      <circle cx="9" cy="9" r="1.5" fill="currentColor" />
      <circle cx="14" cy="9" r="1.5" fill="currentColor" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg className="sheet-search-icon" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="m12 12 3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

type ItemAction = {
  itemId: string
  run: () => Promise<unknown>
  optimistic: (item: api.ListItem) => api.ListItem | null
}
