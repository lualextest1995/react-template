const raw = [
  {
    name: '運營管理',
    i18nkey: 'operationManagement',
    path: '/operationManagement',
    page: [
      {
        name: '訂單管理',
        i18nkey: 'orderManagement',
        path: '/orderManagement',
        grant: ['list', 'export'],
      },
      {
        name: '退貨管理',
        i18nkey: 'returnManagement',
        path: '/returnManagement',
        grant: ['list', 'export'],
      },
    ],
  },
]

function transformToRoutes(data) {
  return data.map((module) => ({
    path: module.path,
    children: module.page.map((p) => ({
      path: p.path,
      Component: routeComponentMap[p.path.slice(1)],
      loader: 'function',
    })),
  }))
}

const routeComponentMap= {
  orderManagement: '123',
  returnManagement: '456',
}

const routes = transformToRoutes(raw)
// console.log(JSON.stringify(routes, null, 2))


function transformToMenu(data) {
  return data.map((module) => ({
    title: module.name,
    url: module.path,
    items: module.page.map((p) => ({
      title: p.name,
      url: p.path,
    })),
  }))
}

const menu = transformToMenu(raw)
// console.log(JSON.stringify(menu, null, 2))