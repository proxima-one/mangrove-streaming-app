import { JsonObject, documents } from "@proxima-one/proxima-core";

export interface ViewBase extends JsonObject {
  //id: string;
}

export class DocumentUpdateBuilder<TContent extends ViewBase> {
  public constructor(
    private readonly id: string,
    private readonly type: string,
    private readonly content?: TContent
  ) {}

  public delete(): documents.DocumentUpdate {
    return new documents.DocumentUpdate(
      new documents.DocumentMetadata(this.id, this.type),
      new documents.DeleteDocument()
    );
  }

  public setContent(): documents.DocumentUpdate {
    if (this.content == undefined)
      // default behavior state = undefined when aggregate root is not created
      return this.delete();

    return new documents.DocumentUpdate(
      new documents.DocumentMetadata(this.id, this.type),
      new documents.SetDocumentContent(this.content)
    );
  }
}
