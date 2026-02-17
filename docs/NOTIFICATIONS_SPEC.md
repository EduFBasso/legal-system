# Notifications System Specification

## Overview

The Notifications system provides real-time alerts for legal publications, deadlines, and process updates. Integrated with Web Notifications API for desktop alerts and features configurable retroactive filtering.

**Status**: ✅ Implemented (February 2026)

---

## Features

### 🔗 Official Links Integration

**TJSP Direct Access (Operational)**

- Extracts court code (`foro`) from process number (last 4 digits)
- Removes leading zeros (0533 → 533)
- Generates ESAJ URL: `https://esaj.tjsp.jus.br/cpopg/show.do?processo.codigo={foro}&processo.numero={numero}`
- Pre-fills search form (1-click access to full process)
- Removes `www.` prefix to avoid SSL wildcard certificate errors
- **Client feedback**: "Maravilha!" - Superior to official system

**Investigation Process (Mission 007)**

- 10+ URL pattern iterations tested
- Discovered: `processo.codigo` (not `processo.foro`) is the key
- SSL issue resolved: wildcard cert `*.tjsp.jus.br` doesn't cover `www.dje.tjsp.jus.br`
- Final solution validated with real publication: `1006581-93.2025.8.26.0533`

**Other Courts (Prepared, not tested)**

- TRF3: Pattern identified, awaiting publications for testing
- TRT2: TODO when publications available
- TRT15: TODO when publications available

---

## Data Model

### Notification

```python
class Notification(models.Model):
    """
    System notification for publications, deadlines, and updates.
    """

    NOTIFICATION_TYPES = [
        ('publication', 'Nova Publicação'),
        ('deadline', 'Prazo Próximo'),
        ('process', 'Atualização de Processo'),
        ('system', 'Sistema'),
    ]

    PRIORITY_LEVELS = [
        ('low', 'Baixa'),
        ('medium', 'Média'),
        ('high', 'Alta'),
        ('urgent', 'Urgente'),
    ]

    type = CharField(max_length=20, choices=NOTIFICATION_TYPES, default='system')
    priority = CharField(max_length=10, choices=PRIORITY_LEVELS, default='medium')
    title = CharField(max_length=200)
    message = TextField()
    link = CharField(max_length=500, blank=True, null=True)  # Official link or internal route
    metadata = JSONField(blank=True, null=True)  # Extended data (process #, dates, etc)
    read = BooleanField(default=False)
    read_at = DateTimeField(blank=True, null=True)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['read']),
            models.Index(fields=['type']),
        ]
```

---

## Auto-Creation Logic

### Publications → Notifications

**Trigger**: When `search_publications()` finds new publications

**Priority Assignment**:

```python
tipo_comunicacao = pub.get('tipo_comunicacao', '').lower()

if 'intimação' in tipo_comunicacao or 'citação' in tipo_comunicacao:
    priority = 'high'
elif 'despacho' in tipo_comunicacao:
    priority = 'medium'
else:
    priority = 'low'
```

**Deduplication**:

```python
notification_exists = Notification.objects.filter(
    type='publication',
    metadata__id_api=pub.get('id_api')
).exists()

if notification_exists:
    continue  # Skip
```

**Retroactive Days Filter**:

```python
from datetime import datetime, timedelta, timezone

# Configurable: 0-30 days (default: 7)
cutoff_date = datetime.now(timezone.utc).date() - timedelta(days=retroactive_days)
pub_date = datetime.fromisoformat(data_disp).date()

if pub_date < cutoff_date:
    continue  # Skip old publications
```

**Limits**:

- Max 5 notifications per search (prevents flooding)
- Skip if `retroactive_days = 0` (disable auto-notifications)

---

## REST API

### Endpoints

**List Notifications**

```
GET /api/notifications/
Response: { results: [Notification...], count: Int }
```

**Unread Count & List**

```
GET /api/notifications/unread/
Response: { count: Int, notifications: [Notification...] }
```

**Statistics**

```
GET /api/notifications/stats/
Response: {
  total: Int,
  unread: Int,
  by_type: { publication: Int, deadline: Int, ... },
  by_priority: { high: Int, medium: Int, ... }
}
```

**Mark as Read (Bulk)**

```
POST /api/notifications/mark_read/
Body: { notification_ids: [1, 2, 3] }
Response: { marked: Int }
```

**Mark All as Read**

```
POST /api/notifications/mark_all_read/
Response: { marked: Int }
```

**Toggle Read Status**

```
POST /api/notifications/{id}/toggle_read/
Response: { notification: Notification, read: Boolean }
```

**Create Test Notification** (Dev only)

```
POST /api/notifications/test/
Response: { id: Int, notification: Notification }
```

---

## Frontend Implementation

### NotificationsContext

**State Management**:

```jsx
const [notifications, setNotifications] = useState([]);
const [unreadCount, setUnreadCount] = useState(0);
const [permission, setPermission] = useState("default");
```

**Auto-Polling** (30 seconds):

```jsx
useEffect(() => {
  fetchUnreadNotifications();
  const interval = setInterval(fetchUnreadNotifications, 30000);
  return () => clearInterval(interval);
}, []);
```

**Web Notifications API**:

```jsx
const showWebNotification = useCallback(
  (notification) => {
    if (permission !== "granted") return;

    const webNotif = new Notification(notification.title, {
      body: notification.message,
      icon: "/favicon.ico",
      tag: `notification-${notification.id}`,
      requireInteraction: notification.priority === "urgent",
    });

    webNotif.onclick = () => {
      window.focus();
      if (notification.link) window.location.href = notification.link;
    };
  },
  [permission],
);
```

**Permission Request**:

- Auto-request after 2s delay
- Manual trigger via banner button
- Stored in state for conditional rendering

---

### NotificationsPage

**Features**:

- Filter tabs: All / Unread / Read
- Type icons: 📰 📰⏰ ⚖️ 💻
- Priority colors with border-left accent
- Relative timestamps ("Agora", "5 min atrás", "2h atrás", "3d atrás")
- Mark as read button (conditional, only unread)
- Smart links:
  - Official links (http): Open in new tab with "🔍 Consultar Processo"
  - Internal links (/publications): Open in same tab with "Ver detalhes →"

**Empty States**:

```jsx
{
  filteredNotifications.length === 0 && (
    <div className="empty-state">
      <span className="empty-icon">🔔</span>
      <p>
        Nenhuma notificação{" "}
        {activeFilter === "unread"
          ? "não lida"
          : activeFilter === "read"
            ? "lida"
            : ""}
      </p>
    </div>
  );
}
```

---

### Menu Badge

**Visual Indicator**:

```jsx
{
  unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>;
}
```

**Styling**:

```css
.notification-badge {
  position: absolute;
  top: 8px;
  right: 16px;
  background: #ef4444;
  color: white;
  font-size: 11px;
  font-weight: 700;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}
```

---

## Settings Integration

### Retroactive Days Configuration

**UI Location**: Settings Modal → "🔔 Notificações" section

**Field**:

```jsx
<input
  type="number"
  value={localSettings.retroactiveDays || 7}
  onChange={handleRetroactiveDaysChange}
  min="0"
  max="30"
/>
<span>dias</span>
```

**Validation**:

```jsx
const value = parseInt(e.target.value) || 0;
setLocalSettings((prev) => ({
  ...prev,
  retroactiveDays: Math.max(0, Math.min(30, value)),
}));
```

**Storage**: localStorage key `legalSystemSettings`

**Default**: 7 days

**Special Cases**:

- `0 days` → No automatic notifications
- `1-7 days` → Recent publications only
- `8-30 days` → Wide historical window

---

## Publication Cards & Modal

### Official Link Buttons

**Publication Card**:

```jsx
{
  publication.link_oficial && (
    <a
      href={publication.link_oficial}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-official-link"
      onClick={(e) => e.stopPropagation()}
    >
      🔍 Consultar Processo
    </a>
  );
}
```

**Publication Detail Modal**:

```jsx
{
  publication.link_oficial && (
    <a
      href={publication.link_oficial}
      target="_blank"
      className="btn btn-primary-link"
    >
      🔍 Consultar Processo no ESAJ
    </a>
  );
}
```

**Styling** (Green gradient theme):

```css
.btn-official-link {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-radius: 6px;
  padding: 0.375rem 0.875rem;
  font-size: 0.813rem;
  transition: all 0.2s ease;
}

.btn-official-link:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
}
```

---

## Performance & Optimization

### Backend

- **Indexes**: created_at, read, type for fast queries
- **Bulk operations**: mark_read accepts multiple IDs
- **Deduplication**: metadata\_\_id_api check prevents duplicates
- **Limits**: Max 5 notifications per search

### Frontend

- **Polling interval**: 30s (balance between real-time and server load)
- **Context provider**: Single source of truth, prevents prop drilling
- **localStorage**: Settings persist across sessions
- **Conditional rendering**: Only show components when needed

---

## Testing Checklist

### Manual Tests

- [x] Search publications (old period) → No notifications
- [x] Search publications (recent) → Creates notifications
- [x] Set retroactive_days = 0 → No auto-notifications
- [x] Set retroactive_days = 30 → Creates for all within 30 days
- [x] Click official link → Opens ESAJ pre-filled
- [x] Mark as read → Updates UI and badge
- [x] Browser notifications → Shows desktop alert
- [x] Permission denied → Shows banner prompt
- [x] Filter tabs → Shows correct notifications
- [ ] Multiple tribunals (TRF3, TRT2, TRT15) → Pending publications

### Automated Tests (Future)

- [ ] Unit: Date filtering logic
- [ ] Unit: Link construction per tribunal
- [ ] Unit: Priority assignment logic
- [ ] Integration: Auto-creation workflow
- [ ] Integration: Deduplication
- [ ] E2E: Search → Notification → Mark read → Badge update

---

## Known Limitations

1. **ESAJ Link**: Pre-fills form but requires 1 click "Consultar" (cannot auto-submit due to CSRF)
2. **Browser Notifications**: Requires user permission (cannot auto-grant)
3. **Tribunal Coverage**: Only TJSP tested (others prepared but unvalidated)
4. **Polling Delay**: Max 30s delay for new notifications (acceptable for legal use case)
5. **No Persistence**: Browser notifications cleared on browser close (by design)

---

## Future Enhancements

- [ ] **Email Notifications**: SMTP integration for daily digest
- [ ] **WhatsApp Integration**: Via Twilio/similar for urgent notifications
- [ ] **Smart Grouping**: Group multiple publications from same process
- [ ] **Snooze Feature**: Remind me later functionality
- [ ] **Custom Rules**: User-defined triggers (e.g., notify only for specific courts)
- [ ] **Push Notifications**: Service Worker for offline notifications
- [ ] **Notification History**: Archive and search old notifications
- [ ] **Calendar Integration**: Deadline notifications → Google Calendar events

---

## Metrics

- **Development Time**: 2 days (investigation + implementation)
- **API Endpoints**: 7 notifications + 3 publications
- **Files Modified**: 13 (backend + frontend)
- **Lines Added**: 268 insertions, 13 deletions
- **URL Iterations**: 10+ patterns tested before success
- **Client Satisfaction**: "Maravilha!" ⭐⭐⭐⭐⭐

---

## References

- [Web Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [PJe Comunica API](https://comunicaapi.pje.jus.br)
- [TJSP ESAJ](https://esaj.tjsp.jus.br/cpopg)
- [Django REST Framework](https://www.django-rest-framework.org/)
