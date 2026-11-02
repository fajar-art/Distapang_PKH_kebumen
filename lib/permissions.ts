export interface SubmenuPermission {
  enabled: boolean;
  mode: 'edit' | 'view'; // 'edit' = bisa edit & kelola, 'view' = hanya lihat
}

export interface ModulePermission {
  enabled: boolean;
  mode: 'edit' | 'view';
  submenus: Record<string, SubmenuPermission>;
}

export interface UserPermissions {
  bitpro: ModulePermission;
  keswan: ModulePermission;
  kesmavet: ModulePermission;
  aset: ModulePermission;
}

export const DEFAULT_FULL_PERMISSIONS: UserPermissions = {
  bitpro: {
    enabled: true,
    mode: 'edit',
    submenus: {
      'data-farm': { enabled: true, mode: 'edit' },
      'database-ktt': { enabled: true, mode: 'edit' },
      'kegiatan-ktt': { enabled: true, mode: 'edit' },
      'monev-ktt': { enabled: true, mode: 'edit' },
      'populasi-dan-produksi': { enabled: true, mode: 'edit' },
      'sapitime': { enabled: true, mode: 'edit' },
      'sklb': { enabled: true, mode: 'edit' },
      'database-ib': { enabled: true, mode: 'edit' },
    },
  },
  keswan: {
    enabled: true,
    mode: 'edit',
    submenus: {
      'data-vaksinasi': { enabled: true, mode: 'edit' },
      'lalu-lintas-ternak': { enabled: true, mode: 'edit' },
      'laporan-penyakit': { enabled: true, mode: 'edit' },
      'puskeswan': { enabled: true, mode: 'edit' },
      'stok-gudang': { enabled: true, mode: 'edit' },
    },
  },
  kesmavet: {
    enabled: true,
    mode: 'edit',
    submenus: {
      'nkv': { enabled: true, mode: 'edit' },
      'rph-tph-tpu': { enabled: true, mode: 'edit' },
      'pakan-ternak': { enabled: true, mode: 'edit' },
      'pasar-hewan': { enabled: true, mode: 'edit' },
      'hewan-kurban': { enabled: true, mode: 'edit' },
    },
  },
  aset: {
    enabled: true,
    mode: 'edit',
    submenus: {
      'inventaris-kendaraan': { enabled: true, mode: 'edit' },
    },
  },
};

export const DEFAULT_VIEW_ONLY_PERMISSIONS: UserPermissions = {
  bitpro: {
    enabled: true,
    mode: 'view',
    submenus: {
      'data-farm': { enabled: true, mode: 'view' },
      'database-ktt': { enabled: true, mode: 'view' },
      'kegiatan-ktt': { enabled: true, mode: 'view' },
      'monev-ktt': { enabled: true, mode: 'view' },
      'populasi-dan-produksi': { enabled: true, mode: 'view' },
      'sapitime': { enabled: true, mode: 'view' },
      'sklb': { enabled: true, mode: 'view' },
      'database-ib': { enabled: true, mode: 'view' },
    },
  },
  keswan: {
    enabled: true,
    mode: 'view',
    submenus: {
      'data-vaksinasi': { enabled: true, mode: 'view' },
      'lalu-lintas-ternak': { enabled: true, mode: 'view' },
      'laporan-penyakit': { enabled: true, mode: 'view' },
      'puskeswan': { enabled: true, mode: 'view' },
      'stok-gudang': { enabled: true, mode: 'view' },
    },
  },
  kesmavet: {
    enabled: true,
    mode: 'view',
    submenus: {
      'nkv': { enabled: true, mode: 'view' },
      'rph-tph-tpu': { enabled: true, mode: 'view' },
      'pakan-ternak': { enabled: true, mode: 'view' },
      'pasar-hewan': { enabled: true, mode: 'view' },
      'hewan-kurban': { enabled: true, mode: 'view' },
    },
  },
  aset: {
    enabled: true,
    mode: 'view',
    submenus: {
      'inventaris-kendaraan': { enabled: true, mode: 'view' },
    },
  },
};

export function getDefaultPermissionsForRole(role: string): UserPermissions {
  const r = (role || '').toLowerCase();
  if (r === 'administrator' || r === 'admin' || r === 'superadmin') {
    return JSON.parse(JSON.stringify(DEFAULT_FULL_PERMISSIONS));
  }

  const base: UserPermissions = JSON.parse(JSON.stringify(DEFAULT_VIEW_ONLY_PERMISSIONS));

  if (r === 'tim bitpro') {
    base.bitpro.enabled = true;
    base.bitpro.mode = 'edit';
    Object.keys(base.bitpro.submenus).forEach((s) => {
      base.bitpro.submenus[s] = { enabled: true, mode: 'edit' };
    });
  } else if (r === 'tim keswan') {
    base.keswan.enabled = true;
    base.keswan.mode = 'edit';
    Object.keys(base.keswan.submenus).forEach((s) => {
      base.keswan.submenus[s] = { enabled: true, mode: 'edit' };
    });
  } else if (r === 'tim kesmavet') {
    base.kesmavet.enabled = true;
    base.kesmavet.mode = 'edit';
    Object.keys(base.kesmavet.submenus).forEach((s) => {
      base.kesmavet.submenus[s] = { enabled: true, mode: 'edit' };
    });
  } else if (r === 'puskeswan') {
    base.keswan.enabled = true;
    base.keswan.mode = 'edit';
    base.keswan.submenus['puskeswan'] = { enabled: true, mode: 'edit' };
    base.keswan.submenus['data-vaksinasi'] = { enabled: true, mode: 'edit' };
    base.keswan.submenus['laporan-penyakit'] = { enabled: true, mode: 'edit' };
    base.keswan.submenus['lalu-lintas-ternak'] = { enabled: true, mode: 'edit' };
  } else if (r === 'petugas pkb') {
    // Petugas PKB memiliki akses pemeriksaan ke SapiTime, Database IB, dan Pasar Hewan
    base.bitpro.enabled = true;
    base.bitpro.mode = 'edit';
    base.bitpro.submenus['sapitime'] = { enabled: true, mode: 'edit' };
    base.bitpro.submenus['database-ib'] = { enabled: true, mode: 'edit' };

    base.kesmavet.enabled = true;
    base.kesmavet.mode = 'edit';
    base.kesmavet.submenus['pasar-hewan'] = { enabled: true, mode: 'edit' };
  } else if (r === 'petugas lapangan') {
    // Form IB, Keswan, dan Pasar Hewan
    base.bitpro.enabled = true;
    base.bitpro.mode = 'edit';
    base.bitpro.submenus['sapitime'] = { enabled: true, mode: 'edit' };
    base.bitpro.submenus['database-ib'] = { enabled: true, mode: 'edit' };

    base.keswan.enabled = true;
    base.keswan.mode = 'edit';
    base.keswan.submenus['data-vaksinasi'] = { enabled: true, mode: 'edit' };
    base.keswan.submenus['laporan-penyakit'] = { enabled: true, mode: 'edit' };
    base.keswan.submenus['puskeswan'] = { enabled: true, mode: 'edit' };

    base.kesmavet.enabled = true;
    base.kesmavet.mode = 'edit';
    base.kesmavet.submenus['pasar-hewan'] = { enabled: true, mode: 'edit' };
  }

  return base;
}
