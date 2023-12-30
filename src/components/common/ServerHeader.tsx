import { Check } from "@styled-icons/boxicons-regular";
import { Cog } from "@styled-icons/boxicons-solid";
import { observer } from "mobx-react-lite";
import { Link } from "react-router-dom";
import { Server } from "revolt.js";
import styled, { css, createGlobalStyle } from "styled-components/macro";

import { Text } from "preact-i18n";
import { IconButton } from "@revoltchat/ui";
import Tooltip from "./Tooltip";

interface Props {
    server: Server;
    background?: boolean;
}

// Keyframes for pulsating effect
const pulsateKeyframes = css`
    @keyframes pulsate {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
`;

// Keyframes for RGB text effect
const rainbowTextKeyframes = css`
    @keyframes rainbowText {
        0%,100% { filter: hue-rotate(0deg); }
        50% { filter: hue-rotate(-360deg); }
    }
`;

// Global style for keyframes
const GlobalStyle = createGlobalStyle`
    ${pulsateKeyframes}
    ${rainbowTextKeyframes}
`;

const ServerBanner = styled.div<Omit<Props, "server"> & { isOfficialServer: boolean }>`
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

            ${(props) => props.isOfficialServer && css`
                animation: pulsate 1.5s ease-in-out infinite, rainbowText 6s ease-in-out infinite;
            `}
        }
    }
`;

export default observer(({ server }: Props) => {
    const bannerURL = server.generateBannerURL({ width: 480 });
    const isOfficialServer = server._id === "01HHVH0ENWJMSHZF37DJH07J0Z";

    return (
        <>
            <GlobalStyle />
            <ServerBanner
                background={typeof bannerURL !== "undefined"}
                style={{ backgroundImage: bannerURL ? `url('${bannerURL}')` : undefined }}
                isOfficialServer={isOfficialServer}>
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
        </>
    );
});
