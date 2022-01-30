import * as proxima from "@proxima-one/proxima-core";
import { OfferListOffersAggregate, OfferListOffersId } from "./offerListOffers";
import { OfferListKey } from "../../../model";

describe("OfferListOffersAggregate", () => {
  const token1 = proxima.eth.Address.fromHexString(
    "0x001b3b4d0f3714ca98ba10f6042daebf0b1b7b6f"
  );
  const token2 = proxima.eth.Address.fromHexString(
    "0x2058a9d7613eee744279e3856ef0eada5fcbaa7e"
  );
  const id = new OfferListOffersId(
    "mangrove-unit-tests",
    new OfferListKey(token1, token2)
  );
  it("should add and remove offers", () => {
    const sut = new OfferListOffersAggregate(id);

    sut.writeOffer(2, 0);
    sut.writeOffer(5, 2);
    sut.writeOffer(6, 5);
    sut.writeOffer(3, 0);
    sut.writeOffer(7, 5);

    sut.removeOffer(2);
    sut.writeOffer(7, 3);

    expect(sut.state.offers).toEqual([3, 7, 5, 6]);
  });
});
