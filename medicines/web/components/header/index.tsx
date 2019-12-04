import React from 'react';
import ReactGA from 'react-ga-gtm';
import styled from 'styled-components';
import { primaryColor } from '../../styles/colors';
import {
  baseSpace,
  desktopMaxWidth,
  mobileBreakpoint,
} from '../../styles/dimensions';
import SvgMhraLogo from '../logos/mhra-logo';

const mhra = 'Medicines Information';

const Header = styled.header`
  border-top: 4px solid ${primaryColor};
  width: 100%;

  .wrapper {
    margin: 0 auto;
    max-width: ${desktopMaxWidth};
    padding: ${baseSpace} ${baseSpace} 0;
  }

  picture {
    max-width: 224px;
    margin-bottom: 115px;
  }

  h1 {
    margin: 0;
    border-bottom: 4px solid ${primaryColor};
    padding-bottom: 0.5rem;
    font-size: 2.25rem;
  }

  @media ${mobileBreakpoint} {
    border-bottom: 4px solid ${primaryColor};
    padding: ${baseSpace} 0.325rem 0;
    picture {
      max-width: 200px;
      margin-bottom: 50px;
    }

    h1 {
      font-size: 1.5rem;
      border-bottom: none;
    }
  }
`;

if (process.env.GA_TRACKING_ID) {
  ReactGA.initialize(process.env.GA_TRACKING_ID);
}

const header: React.FC = () => (
  <Header>
    <div className="wrapper">
      <picture>
        <SvgMhraLogo />
      </picture>
      <h1>{mhra}</h1>
    </div>
  </Header>
);

export default header;
