export interface IndexResource {
  systemId: number;
  path: string;
}

export default class AOIndexHelper {
  private items: IndexResource[];
  private checkedLength: number;
  constructor(data: any) {
    this.items = data
      .toString()
      .split(/(?:\r\n|\r|\n)/g)
      .map((item) => {
        const delimeter = item.indexOf('#');
        let systemId: string;
        let path: string;
        if (delimeter !== -1) {
          systemId = item.substring(0, delimeter);
          path = item.substring(delimeter + 1);
        } else {
          systemId = item.substring(0);
        }
        return {
          systemId: systemId ? Number.parseInt(systemId) : undefined,
          path,
        };
      });
    this.checkedLength = this.items.filter(
      (item) => item.path !== undefined,
    ).length;
  }

  *getEntries() {
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].path !== undefined) yield this.items[i];
    }
  }

  findResource(path: string) {
    return this.items.find((resource) => resource.path === path);
  }

  getCount() {
    return this.checkedLength;
  }
}
