import { readFileSync } from "fs";

interface IUNTAPPD_VENUE {
    venue_id: string;
    name: string;
    city: string;
    state: string;
    country: string;
    lat: string;
    lng: string;
}

interface IUNTAPPD_BREWERY {
    brewery_id: string;
    name: string;
    url: string;
    country: string;
    city: string;
    state: string;
}

interface IUNTAPPD_BEER {
    beer_id: string;
    brewery_id: string;
    name: string;
    url: string;
    type: string;
    abv: string;
    ibu: string;
    global_rating_score: string;
    global_weighted_rating_score: string;
}

interface IUNTAPPD_CHECK_IN {
    checkin_id: string;
    beer_id: string;
    brewery_id: string;
    global_rating_score: string;
    global_weighted_rating_score: string;
    tagged_friends: string;
    total_toasts: string;
    total_comments: string;
    created_at: string;
    url: string;
    rating_score: string;
    flavor_profiles: string;
    purchase_venue: string;
    serving_type: string;
    comment: string;
    venue_name?: string;
    photo_url?: string;
}

interface IUNTAPPD_JSON_RECORD {
    beer_name: string;
    brewery_name: string;
    beer_type: string;
    beer_abv: string;
    beer_ibu: string;
    comment: string;
    venue_name?: string;
    venue_city?: string;
    venue_state?: string;
    venue_country?: string;
    venue_lat?: string;
    venue_lng?: string;
    rating_score: string;
    created_at: string;
    checkin_url: string;
    beer_url: string;
    brewery_url: string;
    brewery_country: string;
    brewery_city: string;
    brewery_state: string;
    flavor_profiles: string;
    purchase_venue: string;
    serving_type: string;
    checkin_id: string;
    bid: string;
    brewery_id: string;
    photo_url?: string;
    global_rating_score: number;
    global_weighted_rating_score: number;
    tagged_friends: string;
    total_toasts: string;
    total_comments: string;
}

interface IGatsbyNodeSourceNodesArg {
    actions: {
        createNode: (values: {
            id: string;
            parent: string | null;
            children: [];
            internal: {
                type: string;
                contentDigest: string;
            };
            [key: string]: any;
        }) => any;
        createTypes: (value: string) => void;
    };
    createNodeId: (value: string) => string;
    createContentDigest: (value: any) => any;
}
interface IGatsbyPluginValues {
    src: string;
}
type IGatsbyNodeSourceNodes = (
    args: IGatsbyNodeSourceNodesArg,
    pluginOptions: IGatsbyPluginValues
) => void;
type IGatsbyNodeCreateSchemaCustomizations = (
    args: IGatsbyNodeSourceNodesArg,
    pluginOptions: IGatsbyPluginValues
) => void;

const UNTAPPD_BREWERY = "UNTAPPD_BREWERY";
const UNTAPPD_BEER = "UNTAPPD_BEER";
const UNTAPPD_CHECKIN = "UNTAPPD_CHECK_IN";
const UNTAPPD_VENUE = "UNTAPPD_VENUE";

const onPreInit = () => {
    const pkgRaw = readFileSync("./package.json", "utf8");
    const pkg = JSON.parse(pkgRaw);
    console.info(`Loaded ${pkg.name}:${pkg.version}`);
};

const createVenueId = (value: string) =>
    String(value).replace(new RegExp("[^a-z0-9]{1,}", "i"), "").toLowerCase();

const sourceNodes: IGatsbyNodeSourceNodes = (
    { actions, createNodeId, createContentDigest },
    pluginOptions
) => {
    const recordSetRaw = readFileSync(pluginOptions.src, "utf8");

    const checkins: IUNTAPPD_CHECK_IN[] = [];
    const beers: IUNTAPPD_BEER[] = [];
    const breweries: IUNTAPPD_BREWERY[] = [];
    const venues: IUNTAPPD_VENUE[] = [];

    if (recordSetRaw) {
        const recordSet: IUNTAPPD_JSON_RECORD[] = JSON.parse(recordSetRaw);

        recordSet.forEach((record) => {
            checkins.push({
                checkin_id: record.checkin_id,
                beer_id: record.bid,
                brewery_id: record.brewery_id,
                global_rating_score: String(record.global_rating_score),
                global_weighted_rating_score: String(
                    record.global_weighted_rating_score
                ),
                tagged_friends: record.tagged_friends,
                total_toasts: record.total_toasts,
                total_comments: record.total_comments,
                created_at: record.created_at,
                url: record.checkin_url,
                rating_score: record.rating_score,
                flavor_profiles: record.flavor_profiles,
                purchase_venue: record.purchase_venue,
                serving_type: record.serving_type,
                comment: record.comment,
                venue_name: record.venue_name,
                photo_url: record.photo_url
            });

            if (!beers.some((beer) => beer.beer_id === record.bid)) {
                beers.push({
                    beer_id: record.bid,
                    brewery_id: record.brewery_id,
                    name: record.beer_name,
                    url: record.beer_url,
                    type: record.beer_type,
                    abv: record.beer_abv,
                    ibu: record.beer_ibu,
                    global_rating_score: String(record.global_rating_score),
                    global_weighted_rating_score: String(
                        record.global_weighted_rating_score
                    )
                });
            }

            if (
                !breweries.some(
                    (brewery) => brewery.brewery_id === record.brewery_id
                )
            ) {
                breweries.push({
                    brewery_id: record.brewery_id,
                    name: record.brewery_name,
                    url: record.brewery_url,
                    country: record.brewery_country,
                    city: record.brewery_city,
                    state: record.brewery_state
                });
            }

            if (
                record.venue_name &&
                !venues.some(
                    (venue) =>
                        venue.venue_id ===
                        createVenueId(record.venue_name || "")
                )
            ) {
                venues.push({
                    venue_id: createVenueId(record.venue_name),
                    name: record.venue_name,
                    city: record.venue_city || "",
                    state: record.venue_state || "",
                    country: record.venue_country || "",
                    lat: record.venue_lat || "",
                    lng: record.venue_lng || ""
                });
            }
        });
    }

    const { createNode } = actions;

    checkins.forEach((checkin) => {
        const record = {
            ...checkin,
            brewery: {
                brewery_id: checkin.brewery_id
            },
            beer: {
                beer_id: checkin.beer_id
            },
            venue: {
                venue_id: createVenueId(checkin.venue_name || "")
            }
        };

        createNode({
            ...record,
            id: createNodeId(`${UNTAPPD_CHECKIN}-${checkin.checkin_id}`),
            parent: null,
            children: [],
            internal: {
                type: UNTAPPD_CHECKIN,
                contentDigest: createContentDigest(record)
            }
        });
    });

    beers.forEach((beer) => {
        const record = {
            ...beer,
            brewery: {
                brewery_id: beer.brewery_id
            },
            checkins: checkins
                .filter((checkin) => checkin.beer_id === beer.beer_id)
                .map((checkin) => ({
                    checkin_id: checkin.checkin_id
                }))
        };

        createNode({
            ...record,
            id: createNodeId(`${UNTAPPD_BEER}-${beer.beer_id}`),
            parent: null,
            children: [],
            internal: {
                type: UNTAPPD_BEER,
                contentDigest: createContentDigest(record)
            }
        });
    });

    breweries.forEach((brewery) => {
        const record = {
            ...brewery,
            beers: beers
                .filter((beer) => beer.brewery_id === brewery.brewery_id)
                .map((beer) => ({
                    beer_id: beer.beer_id
                })),
            checkins: checkins
                .filter((checkin) => checkin.brewery_id === brewery.brewery_id)
                .map((checkin) => ({
                    checkin_id: checkin.checkin_id
                }))
        };

        createNode({
            ...record,
            id: createNodeId(`${UNTAPPD_BREWERY}-${brewery.brewery_id}`),
            parent: null,
            children: [],
            internal: {
                type: UNTAPPD_BREWERY,
                contentDigest: createContentDigest(record)
            }
        });
    });

    venues.forEach((venue) => {
        const record = {
            ...venue,
            checkins: checkins
                .filter((checkin) => checkin.venue_name === venue.name)
                .map((checkin) => ({
                    checkin_id: checkin.checkin_id
                }))
        };

        createNode({
            ...record,
            id: createNodeId(`${UNTAPPD_VENUE}-${venue.venue_id}`),
            parent: null,
            children: [],
            internal: {
                type: UNTAPPD_VENUE,
                contentDigest: createContentDigest(record)
            }
        });
    });
};

const createSchemaCustomization: IGatsbyNodeCreateSchemaCustomizations = ({
    actions
}) => {
    const { createTypes } = actions;

    createTypes(`
        type ${UNTAPPD_CHECKIN} implements Node {
            brewery: ${UNTAPPD_BREWERY} @link(from: "brewery.brewery_id" by: "brewery_id")
            beer: ${UNTAPPD_BEER} @link(from: "beer.beer_id" by: "beer_id")
            venue: ${UNTAPPD_VENUE} @link(from: "venue.venue_id" by: "venue_id")
        }

        type ${UNTAPPD_BEER} implements Node {
            brewery: ${UNTAPPD_BREWERY} @link(from: "brewery.brewery_id" by: "brewery_id")
            checkins: [${UNTAPPD_CHECKIN}] @link(from: "checkins.checkin_id" by: "checkin_id")
        }

        type ${UNTAPPD_BREWERY} implements Node {
            beers: [${UNTAPPD_BEER}] @link(from: "beers.beer_id" by: "beer_id")
            checkins: [${UNTAPPD_CHECKIN}] @link(from: "checkins.checkin_id" by: "checkin_id")
        }

        type ${UNTAPPD_VENUE} implements Node {
            checkins: [${UNTAPPD_CHECKIN}] @link(from: "checkins.checkin_id" by: "checkin_id")
        }
    `);
};

export { onPreInit, sourceNodes, createSchemaCustomization };
