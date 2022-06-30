import * as convert from 'xml-js';
import { DatabaseResource, DatabaseResourceField } from './Types';

export default class AOResourceSerializer {
  private xdbData: convert.ElementCompact | null = null;
  private xdbRoot: convert.ElementCompact | null = null;

  parseXDB(xdb: string) {
    this.xdbData = convert.xml2js(xdb, { compact: true });
    const typeName = this.getType();
    if (typeName) this.xdbRoot = this.xdbData[typeName];
    return this;
  }

  parse(databaseResource: DatabaseResource) {
    this.xdbData = this.constructXDB(databaseResource);
    const typeName = this.getType();
    if (typeName) this.xdbRoot = this.xdbData[typeName];
    return this;
  }

  private addField(
    element: convert.ElementCompact,
    field: DatabaseResourceField,
  ) {
    const fieldName = field.name;
    if (!element) return;
    if (field.isArray) {
      element[fieldName] = [];
      field.fields?.forEach((field) =>
        this.addField(element[fieldName], field),
      );
    } else {
      element[fieldName] = {};
      element[fieldName]._text = field.text;
      if (field.attributes) {
        element[fieldName]._attributes = {};
        field.attributes?.forEach((attr) => {
          element[fieldName]._attributes[attr.name] = attr.value;
        });
      }
      field.fields?.forEach((field) =>
        this.addField(element[fieldName], field),
      );
    }
  }

  private constructXDB(
    databaseResource: DatabaseResource,
  ): convert.ElementCompact {
    const xdbContent: any = {};

    // define declaration
    xdbContent._declaration = {
      _attributes: {
        version: '1.0',
        encoding: 'UTF-8',
      },
    };

    const typeName = databaseResource.typeName;
    xdbContent[typeName] = {};
    const rootField = xdbContent[typeName];

    // adding ID
    rootField.Header = { resourceId: databaseResource.resourceId };

    databaseResource.fields?.forEach((field) => {
      this.addField(rootField, field);
    });
    return xdbContent;
  }

  buildXDB() {
    // convert to json for removing undefined values
    if (this.xdbData)
      return convert.json2xml(JSON.stringify(this.xdbData), { compact: true });
    return undefined;
  }

  private parseFields(
    parent: convert.ElementCompact,
  ): DatabaseResourceField[] | undefined {
    return this.getFields(parent)?.map((fieldName) => {
      const field = this.getField(parent, fieldName);
      return <DatabaseResourceField>{
        name: fieldName,
        text: this.getFieldValue(field),
        attributes: this.getFieldAttributes(field),
        fields: this.parseFields(field),
        isArray: Array.isArray(field),
      };
    });
  }

  toDatabaseResource(): DatabaseResource | undefined {
    if (this.xdbRoot) {
      const typeName = this.getType();
      if (typeName !== undefined) {
        return {
          typeName: typeName,
          resourceId: this.getId(),
          fields: this.parseFields(this.xdbRoot),
        };
      }
    }
    return undefined;
  }

  // search first element in children
  getFields(field: convert.ElementCompact) {
    if (field) {
      return Object.keys(field).filter(
        (field) => !field.startsWith('_') && field !== 'Header',
      );
    }
    return undefined;
  }

  getField(parent: convert.ElementCompact, fieldName: string) {
    if (parent) {
      return parent[fieldName];
    }
    return undefined;
  }

  getType() {
    if (this.xdbData) {
      return Object.keys(this.xdbData).find((name) => !name.startsWith('_'));
    }
    return undefined;
  }

  getId() {
    if (this.xdbRoot) {
      return this.xdbRoot?.Header?.resourceId?._text;
    }
    return undefined;
  }

  getFieldValue(field: convert.ElementCompact) {
    if (field) {
      if (field._text) {
        return field._text.toString();
      }
    }
    return undefined;
  }

  getFieldAttributes(field: convert.ElementCompact) {
    if (field) {
      if (field._attributes) {
        return Object.keys(field._attributes).map((key) => ({
          name: key,
          value: field._attributes?.[key],
        }));
      }
    }
    return undefined;
  }

  getRootFields() {
    if (this.xdbRoot) {
      return this.getFields(this.xdbRoot)?.filter((name) => name !== 'Header');
    }
    return undefined;
  }

  getRootField(fieldName: string) {
    if (this.xdbRoot) {
      return this.getField(this.xdbRoot, fieldName);
    }
    return undefined;
  }

  test() {
    return this.xdbRoot?.destinations;
  }
}
