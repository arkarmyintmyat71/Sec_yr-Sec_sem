(function () {
  'use strict';

  // ── SAFETY: ensure data exists ──
  if (typeof staffList === 'undefined' || staffList === null) {
    console.error('staffList not loaded from backend');
    staffList = [];
  }

  console.log("Loaded staffList:", staffList);

  // ── AVATAR COLOURS ──
  const AVATAR_PALETTES = [
    { bg: '#dbeafe', text: '#1e40af' },
    { bg: '#d1fae5', text: '#065f46' },
    { bg: '#fce7f3', text: '#9d174d' },
    { bg: '#ede9fe', text: '#5b21b6' },
    { bg: '#fef3c7', text: '#92400e' },
    { bg: '#fee2e2', text: '#991b1b' },
    { bg: '#e0f2fe', text: '#0c4a6e' },
    { bg: '#f0fdf4', text: '#14532d' },
  ];

  // ✅ SUPPORT fullName
  function getFullName(s) {
    if (s.fullName) return s.fullName;
    return ((s.firstName || '') + ' ' + (s.lastName || '')).trim();
  }

  function avatarPalette(name) {
    if (!name) return AVATAR_PALETTES[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
  }

  function initials(name) {
    if (!name) return '?';
    return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  function capitalise(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
  }

  function formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  }

  let activeFilter = 'all';
  let pendingRejectId = null;

  let detailsModalBS = null;
  let rejectModalBS  = null;

  // ── RENDER ──
  function render() {
    const list = document.getElementById('staffCardsList');

    const filtered = staffList.filter(s =>
        activeFilter === 'all' || (s.status || '').toLowerCase() === activeFilter
    );

    if (!filtered.length) {
      list.innerHTML = `
        <div class="sr-empty">
          <div class="sr-empty-icon">👥</div>
          <p>No ${activeFilter === 'all' ? '' : activeFilter} registrations found.</p>
        </div>`;
      return;
    }

    list.innerHTML = filtered.map((s, i) => buildCard(s, i)).join('');
  }

  function buildCard(s, i) {
    const name = getFullName(s);
    const pal  = avatarPalette(name);
    const init = initials(name);
    const delay = i * 0.06;

    let metaLine = '';
    if (s.status === 'pending') {
      metaLine = `${s.email || ''} · ${s.phone || ''} · Registered ${formatDate(s.createdAt)}`;
    } else if (s.status === 'approved') {
      metaLine = `${s.email || ''} · Approved ${formatDate(s.updatedAt)}`;
    } else {
      metaLine = `${s.email || ''} · Reject ${formatDate(s.updatedAt)} · Reason: ${s.rejectReason || ''}`;
    }

    let actionBtns = '';
    if (s.status === 'pending') {
      actionBtns = `
        <a href="/admin/staff/edit/${s.id}" class="sr-btn-view">View / Edit</a>
        <button class="sr-btn-approve" onclick="srApprove(${s.id})">Approve</button>
        <button class="sr-btn-reject" onclick="srOpenReject(${s.id})">Reject</button>`;
    } else {
      actionBtns = `
        <a href="/admin/staff/edit/${s.id}" class="sr-btn-view">View / Edit</a>`;
    }

    const salaryDisplay = s.monthlySalary
        ? `฿${s.monthlySalary.toLocaleString()}/mo`
        : `<em>Not specified (admin sets)</em>`;

    return `
      <div class="sr-card" style="animation-delay:${delay}s">
        <div class="sr-card-top">
          <div class="sr-avatar" style="background:${pal.bg};color:${pal.text}">${init}</div>

          <div class="sr-info">
            <div class="sr-name-row">
              <span class="sr-name">${name}</span>
              <span class="sr-badge-role">${s.role || 'No Role'}</span>
              <span class="sr-badge-status ${s.status}">${capitalise(s.status)}</span>
            </div>
            <div class="sr-meta">${metaLine}</div>
          </div>

          <div class="sr-actions">${actionBtns}</div>
        </div>

        <div class="sr-card-bottom">
          <div class="sr-detail-item">Experience: <strong>${s.experience || '-'}</strong></div>
          <div class="sr-detail-item">Availability: <strong>${s.availability || '-'}</strong></div>
          <div class="sr-detail-item">Expected salary: ${salaryDisplay}</div>
        </div>
      </div>`;
  }

  // ── APPROVE ──
  window.srApprove = async function (id) {
    console.log("Approving ID:", id);

    try {
      const res = await fetch(`/admin/staff/${id}/approve`, {
        method: 'PUT'
      });

      if (!res.ok) {
        const msg = await res.text(); // 🔥 IMPORTANT
        console.error("Approve failed:", res.status, msg);
        alert("Approve failed: " + res.status);
        return;
      }

      const s = staffList.find(x => x.id === id);
      if (s) {
        s.status = 'approved';
      }

      render();

    } catch (err) {
      console.error("Network error:", err);
    }
  };

  // ── REJECT ──
  window.srOpenReject = function (id) {
    pendingRejectId = id;
    rejectModalBS.show();
  };

  async function confirmReject() {
    const notes = document.getElementById('rejectNotes').value;

    try {
      const res = await fetch(`/admin/staff/${pendingRejectId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes })
      });

      if (!res.ok) {
        const msg = await res.text();
        console.error("Reject failed:", res.status, msg);
        alert("Reject failed: " + res.status);
        return;
      }

      const s = staffList.find(x => x.id === pendingRejectId);
      if (s) {
        s.status = 'rejected';
        s.notes = notes;
      }

      rejectModalBS.hide();
      render();

    } catch (err) {
      console.error("Network error:", err);
    }
  }

  // ── FILTER ──
  function initTabs() {
    document.querySelectorAll('.sr-tab').forEach(btn => {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.sr-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.filter;
        render();
      });
    });
  }

  // ── INIT ──
  document.addEventListener('DOMContentLoaded', function () {
    detailsModalBS = new bootstrap.Modal(document.getElementById('detailsModal'));
    rejectModalBS  = new bootstrap.Modal(document.getElementById('rejectModal'));

    document.getElementById('rejectConfirmBtn')
        .addEventListener('click', confirmReject);

    initTabs();
    render();
  });

})();