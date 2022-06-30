import { TypeFieldInfo, TypeInfo } from './Types';

export default class AOTypesParser {
  xdb: any = null;
  items: any[] = [];

  constructor(xdb: any) {
    if (xdb !== undefined) {
      this.xdb = xdb;
      this.items = this.xdb?.elements?.[0]?.elements?.[1]?.elements;
    }
  }

  *getIterable() {
    for (let i = 0; i < this.items.length; i++) {
      yield this.getTypeInfo(this.getTypeName(this.items[i]));
    }
  }

  checkXmlData() {
    return !!this.xdb?.elements?.[0]?.elements?.[1]?.elements;
  }

  findType(typeName: string) {
    let type = this.items.filter(
      (item: any) => this.getSrvType(item) === typeName,
    );
    if (type.length !== 0) {
      return type[0];
    } else {
      type = this.items.filter(
        (item: any) => this.getTypeName(item) === typeName,
      );
      if (type.length !== 0) return type[0];
      else return undefined;
    }
  }

  getChildrenWithInfo(typeName: string) {
    const children = this.getChildTypes(typeName);
    return children.map((child: string) => ({
      name: child,
      desc: this.getDescription(child),
    }));
  }

  getTypeInfo(typeName: string): TypeInfo | undefined {
    const type = this.findType(typeName);
    if (type) {
      const systemType = this.getType(type);
      return {
        typeName: this.getTypeName(type),
        serverTypeName: this.getSrvType(type),
        systemType: systemType,
        description: this.getDescription(type),
        attributes: this.getAttributes(type),
        baseType: this.getBaseType(type),
        fields: this.getAllFieldsForType(typeName),
        enumValues:
          systemType !== undefined && systemType === 'TYPE_TYPE_ENUM'
            ? this.getEnumValues(type)
            : undefined,
      };
    } else return undefined;
  }

  getEnumValues(item: any) {
    let res = undefined;

    const name = item.elements.filter((el: any) => el.name === 'Entries');
    if (name !== undefined && name[0] !== undefined) {
      if (name[0].elements !== undefined) {
        res = name[0].elements.map(
          (el: any) => el.elements[0].elements[0].text,
        );
      }
    }

    return res;
  }

  getChildTypes(typeName: string) {
    const ret = [];

    const items = this.items
      .filter((item: any) => this.getBaseType(item) === typeName)
      .map((item: any) => this.getTypeName(item));

    items.forEach((item: any) => {
      ret.push(...this.getChildTypes(item));
    });
    ret.push(...items);

    return ret;
  }

  getAllFieldsForType(typeName: string) {
    const fields: any = [];

    const type = this.findType(typeName);
    if (type) {
      const typeFields = this.getFields(type);
      const baseType = this.getBaseType(type);

      if (baseType) {
        fields.push(...this.getAllFieldsForType(baseType));
      }

      if (typeFields) fields.push(...typeFields);
    }

    return fields;
  }

  getTypeName(item: any) {
    let res = undefined;

    const name = item.elements.filter((el: any) => el.name === 'TypeName');
    if (name !== undefined && name[0] !== undefined) {
      if (name[0].elements !== undefined) {
        res = name[0].elements[0].text;
      }
    }

    return res;
  }

  getType(item: any) {
    let res = undefined;

    const name = item.elements.filter((el: any) => el.name === 'Type');
    if (name !== undefined && name[0] !== undefined) {
      if (name[0].elements !== undefined) {
        res = name[0].elements[0].text;
      }
    }

    return res;
  }

  getSrvType(item: any) {
    let res = undefined;

    const name = item.elements.filter((el: any) => el.name === '__ServerPtr');
    if (name !== undefined && name[0] !== undefined) {
      if (name[0].elements !== undefined) {
        res = name[0].elements[0].text;
      }
    }

    if (res.endsWith('classfile')) res = res.substr(0, res.length - 9);

    return res;
  }

  getDescription(item: any) {
    let res = undefined;

    const name = item?.elements?.filter((el: any) => el.name === 'Attributes');

    if (name !== undefined && name[0] !== undefined) {
      if (name[0].elements !== undefined && name[0].elements[1] !== undefined) {
        const attributes = name[0].elements[1].elements[0].elements;
        const descAttr = attributes.filter(
          (attribute: any) =>
            attribute.elements[0].elements[0].text === 'description',
        );
        if (descAttr !== undefined && descAttr.length !== 0) {
          res = descAttr[0].elements[1].elements[1].elements[0].text;
        }
      }
    }

    return res;
  }

  getBaseType(item: any) {
    let res = undefined;

    const name = item.elements.filter((el: any) => el.name === 'BaseType');
    if (name !== undefined && name[0] !== undefined) {
      if (name[0].elements !== undefined) {
        res = name[0].elements[0].text;
      }
    }

    if (res !== undefined) {
      if (res === '00000000') res = undefined;
      else if (res.endsWith('classfile')) res = res.substr(0, res.length - 9);
    }

    return res;
  }

  getAttributes(item: any) {
    let res = undefined;

    const name = item.elements.filter((el: any) => el.name === 'Attributes');

    if (name !== undefined && name[0] !== undefined) {
      if (name[0].elements !== undefined && name[0].elements[1] !== undefined) {
        const attributes = name[0].elements[1].elements[0].elements;
        res = attributes.map(
          (attribute: any) => attribute.elements[0].elements[0].text,
        );
      }
    }

    return res;
  }

  getFields(item: any) {
    let res = undefined;

    const name = item.elements.filter((el: any) => el.name === 'Fields');

    if (name !== undefined && name[0] !== undefined) {
      if (name[0].elements !== undefined && name[0].elements[0] !== undefined) {
        res = name[0].elements?.map((field: any) => {
          const fields = field.elements;
          const TypeInfo = this.arrayTypeInfo(fields[0]?.elements?.[0]?.text);
          const Name = fields[1]?.elements?.[0]?.text;
          const Desc = fields[3]?.elements?.[0]?.text;
          const Attributes = this.getAttributes(field);

          const type = this.findType(TypeInfo.type);

          let isAbstract = false;
          let isInline = false;

          if (type) {
            const attribs = this.getAttributes(type);
            if (attribs !== undefined && attribs.length !== 0) {
              isAbstract = attribs.includes('abstract');
              isInline = attribs.includes('inline');
            }
          }

          const typeField: TypeFieldInfo = {
            typeName: TypeInfo.type,
            name: Name,
            description: Desc,
            attributes: Attributes,
            isArray: TypeInfo.isArray,
            editorType: undefined,
            systemType: type ? this.getType(type) : undefined,
            isAbstract: isAbstract,
            inline: isInline,
          };

          typeField.editorType = AOTypesParser.defineFieldType(typeField);

          return typeField;
        });
      }
    }

    return res;
  }

  arrayTypeInfo(type: string) {
    const res = { isArray: false, type: type };
    if (type.startsWith('[L')) {
      res.isArray = true;
      res.type = type.substring(2, type.length - 1);
    }
    return res;
  }

  // types = "text", "number", "switch", "href", "array", "locfile", "abstract", "struct"

  static defineFieldType(fieldInfo: TypeFieldInfo) {
    if (fieldInfo.systemType === 'TYPE_TYPE_ENUM') return 'enum';
    if (fieldInfo.systemType === 'TYPE_TYPE_CLASS') return 'href';
    if (fieldInfo.isAbstract && fieldInfo.inline) return 'abstract';
    if (fieldInfo.systemType === 'TYPE_TYPE_STRUCT') return 'struct';
    if (
      fieldInfo.attributes !== undefined &&
      fieldInfo.attributes.includes('filepath')
    )
      return 'locfile';
    if (fieldInfo.typeName === 'java.lang.Integer') return 'int';
    if (fieldInfo.typeName === 'java.lang.Float') return 'float';
    if (fieldInfo.typeName === 'java.lang.Boolean') return 'switch';

    return 'text';
  }

  static tags(field: any) {
    const res = [];
    if (field.attributes !== undefined) {
      if (field.attributes.includes('allowDefault'))
        res.push({ color: 'secondary', text: 'Not required' });

      if (
        (!field.attributes.includes('allowDefault') &&
          !field.attributes.includes('nullable')) ||
        (field.attributes.includes('Not null') &&
          !field.attributes.includes('allowDefault'))
      )
        res.push({ color: 'danger', text: 'Required' });
    }
    return res;
  }
}

/*
{
    typeName: string,
    type: "class" || "struct",
    isPrimitiveType: boolean,
    attributes: string[],
    baseType: string || null,
    fields: {
        typeName: string,
        name: string,
        isArray: boolean,
        desc: string,
        type: "class" || "struct",
        attributes: string[]
    }
}
*/
