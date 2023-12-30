import { Check } from "@styled-icons/boxicons-regular";
import { Cog } from "@styled-icons/boxicons-solid";
import { observer } from "mobx-react-lite";
import { Link } from "react-router-dom";
import { Server } from "revolt.js";
import styled, { css } from "styled-components/macro";

import { Text } from "preact-i18n";

import { IconButton } from "@revoltchat/ui";

import Tooltip from "./Tooltip";

interface Props {
    server: Server;
    background?: boolean;
}

const ServerBanner = styled.div<Omit<Props, "server">>`
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;

    background-size: cover;
    background-repeat: no-repeat;
    background-position: center center;

    ${(props) =>
        props.background
            ? css`
                  height: 120px;

                  .container {
                      background: linear-gradient(
                          0deg,
                          var(--secondary-background),
                          transparent
                      );
                  }
              `
            : css`
                  background-color: var(--secondary-header);
              `}

    .container {
        height: var(--header-height);

        display: flex;
        align-items: center;
        padding: 0 14px;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        gap: 8px;

        .title {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex-grow: 1;

            cursor: pointer;
            color: var(--foreground);
        }
    }
`;

export default observer(({ server }: Props) => {
    const bannerURL = server.generateBannerURL({ width: 480 });
    const isOfficialServer = server._id === "01HHVH0ENWJMSHZF37DJH07J0Z";
    const isVerifiedServer = server.flags && (server.flags & 1); // Adjust this based on how your flags are set up

    return (
        <ServerBanner
            background={typeof bannerURL !== "undefined"}
            style={{ backgroundImage: bannerURL ? `url('${bannerURL}')` : undefined }}>
            <div className="container">
                {isOfficialServer && (
                    <Tooltip content={<Text id="app.special.server-badges.official" />} placement={"bottom-start"}>
                        <svg width="20" height="20">
                            <image xlinkHref="https://panel.match3d.space/badges/official.png" height="20" width="20" />
                        </svg>
                    </Tooltip>
                )}
                {isOfficialServer && (
                    <Tooltip content={<Text id="app.special.server-badges.verified" />} placement={"bottom-start"}>
                        <svg width="20" height="20">
                            <image xlinkHref="https://panel.match3d.space/badges/verified.png" height="20" width="20" />
                        </svg>
                    </Tooltip>
                )}
                <a className="title" onClick={() => modalController.push({ type: "server_info", server })}>
                    {server.name}
                </a>
                {server.havePermission("ManageServer") && (
                    <Link to={`/server/${server._id}/settings`}>
                        <IconButton><Cog size={20} /></IconButton>
                    </Link>
                )}
            </div>
        </ServerBanner>
    );
});
