import React from 'react';
import './Certificate.css';

export interface CertificateData {
  business_name: string;
  business_location: string;
  recipient_name: string;
  role: string;
  validity_start: string;
  validity_end: string;
  issue_date: string;
  permit_id: string;
  plate_no: string;
  driver_name: string;
  driver_name_2?: string;
  driver_name_3?: string;
  origin: string;
  destination: string;
  no_of_boxes: string;
  time_date: string;
  valid_until: string;
  remarks: string;
  ticket_no: string;
  specie: string;
}

// Main Certificate Component

const Certificate: React.FC<{ data: CertificateData }> = ({ data }) => {
  const formatDateTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return '';
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleString('en-PH', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return dateTimeStr;
    }
  };

  const formatLongDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-PH', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="certificate-container">
      <div className="header">
        <div className="logo-container">
          <img src="/logo.png" className="certificate-logo" alt="PFDA Logo" />
        </div>
        <div className="header-text">
          <p>Republic of the Philippines</p>
          <p>Department of Agriculture</p>
          <h1>PHILIPPINE FISHERIES DEVELOPMENT AUTHORITY</h1>
          <p><b>Bulan Fish Port Complex</b></p>
          <p>Pier 2, Zone 4, Bulan, Sorsogon</p>
          <p>TIN : 000-803-752-003</p>
        </div>
      </div>

      <div className="certifies-that">This certifies that</div>

      <div className="business-name-box">
        <h2 className="business-name">{data.business_name || 'BUSINESS NAME'}</h2>
      </div>

      <div className="business-location">
        {data.business_location || 'ADDRESS'}
      </div>

      <div className="main-body-text">
        is a business registered in this office pursuant to the provision of Section I<br />
        of Philippine Fish Market Authority (PFMA) Board Resolution No. 5<br />
        dated February 27, 1979 and in compliance with the applicable<br />
        rules and regulations prescribed by the<br />
        <b>Philippine Fisheries Development Authority</b>
      </div>

      <div className="issued-to">This certificate issued to</div>

      <div className="recipient-name-box">
        <h2 className="recipient-name">{data.recipient_name || 'BROKER NAME'}</h2>
      </div>

      <div className="role-box">
        {data.role || 'FISH BROKER'}
      </div>

      <div className="validity-text">
        is valid from <span className="validity-box">{formatLongDate(data.validity_start) || 'MMMM DD, YYYY'} - {formatLongDate(data.validity_end) || 'March 05, 2027'}</span> subject to continuing<br />
        compliance with the above mentioned regulation of the the agency unless<br />
        voluntarily cancelled. In testimony whereof, I hereby sign this
      </div>

      <div className="permit-title">PERMIT TO CONDUCT BUSINESS</div>

      <div className="issue-date-line">
        and issue the same on <span className="date-box">{data.issue_date || 'April 30, 2026'}</span> in <b>Pier 2, Zone 4, Bulan, Sorsogon</b>
      </div>

      <div className="signature-section">
        <div className="signature-image-container">
          <img src="/signature.png" className="signature-image" alt="Signature" />
        </div>
        <p className="signer-name">FRANCISCO ROMEO G. ESCANDOR, JR.</p>
        <p className="signer-title">CFP/BFPC, OIC/Port Manager</p>
      </div>

      <div className="permit-id-blue-box">
        <div className="permit-id-inner-box">
          {data.permit_id || 'B-PTCB-B-00-0000'}
        </div>
      </div>

      <div className="footer-section">
        <div className="footer-left">
          <div className="footer-field">
            <span className="field-label">Plate No. :</span>
            <span className="field-value">{data.plate_no}</span>
          </div>
          <div className="footer-field">
            <span className="field-label">Driver/Pahinante:</span>
            <span className="field-value">
              {[data.driver_name, data.driver_name_2, data.driver_name_3]
                .filter(Boolean)
                .map((name, idx) => (
                  <div key={idx}>{name}</div>
                ))}
            </span>
          </div>
          <div className="footer-field">
            <span className="field-label">Origin :</span>
            <span className="field-value">{data.origin}</span>
          </div>
          <div className="footer-field">
            <span className="field-label">Destintion:</span>
            <span className="field-value">{data.destination}</span>
          </div>
          <div className="footer-field">
            <span className="field-label">No. of Box(es):</span>
            <span className="field-value">{data.no_of_boxes}</span>
          </div>
          <div className="footer-field">
            <span className="field-label">Ticket No. :</span>
            <span className="field-value">{data.ticket_no}</span>
          </div>
          <div className="footer-field">
            <span className="field-label">Species :</span>
            <span className="field-value">{data.specie}</span>
          </div>
          <div className="footer-field" >
            <span className="field-label" >Time/Date :</span>
            <span className="field-value">{formatDateTime(data.time_date)}</span>
          </div>
          <div className="footer-field">
            <span className="field-label">Valid Until :</span>
            <span className="field-value">{formatDateTime(data.valid_until)}</span>
          </div>
          <div className="footer-field">
            <span className="field-label">Remrks :</span>
            <span className="field-value">{data.remarks}</span>
          </div>
        </div>

        <div className="footer-right">
          <div className="certified-true-copy-box">
            CERTIFIED TRUE COPY
          </div>
          <div className="footer-signature">
            <div className="signature-image-container-small">
              <img src="/signature.png" className="signature-image-small" alt="Signature" />
            </div>
            <p className="signer-name">FRANCISCO ROMEO G. ESCANDOR, JR.</p>
            <p className="signer-title">CFP/BFPC, OIC/Port Manager</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Certificate;
