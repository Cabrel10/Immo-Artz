<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10pt;
            line-height: 1.4;
            color: #333;
        }
        
        .page {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm;
            page-break-after: always;
        }
        
        .page:last-child {
            page-break-after: auto;
        }
        
        /* Header */
        .header {
            text-align: center;
            padding-bottom: 15px;
            border-bottom: 3px solid #1a365d;
            margin-bottom: 20px;
        }
        
        .logo {
            font-size: 32pt;
            font-weight: bold;
            color: #1a365d;
            letter-spacing: 3px;
        }
        
        .tagline {
            font-size: 10pt;
            color: #666;
            margin-top: 5px;
        }
        
        .catalog-info {
            margin-top: 10px;
            font-size: 9pt;
            color: #888;
        }
        
        /* Cover Page */
        .cover {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 250mm;
            text-align: center;
        }
        
        .cover-title {
            font-size: 36pt;
            color: #1a365d;
            margin-bottom: 20px;
        }
        
        .cover-subtitle {
            font-size: 14pt;
            color: #666;
            margin-bottom: 40px;
        }
        
        .cover-stats {
            background: #f7fafc;
            padding: 20px 40px;
            border-radius: 8px;
            margin-top: 30px;
        }
        
        .cover-stats-item {
            font-size: 12pt;
            margin: 8px 0;
        }
        
        .cover-price {
            font-size: 18pt;
            color: #1a365d;
            font-weight: bold;
            margin-top: 30px;
        }
        
        /* Section Headers */
        .section-header {
            background: #1a365d;
            color: white;
            padding: 12px 15px;
            margin: 25px 0 15px 0;
            font-size: 14pt;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .subsection-header {
            background: #e2e8f0;
            color: #1a365d;
            padding: 8px 12px;
            margin: 15px 0 10px 0;
            font-size: 11pt;
            font-weight: bold;
        }
        
        /* Property Cards */
        .property-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .property-card {
            width: calc(50% - 8px);
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            overflow: hidden;
            margin-bottom: 15px;
        }
        
        .property-image {
            width: 100%;
            height: 120px;
            object-fit: cover;
            background: #f7fafc;
        }
        
        .property-content {
            padding: 10px;
        }
        
        .property-standing {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 7pt;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        
        .standing-haut_de_gamme {
            background: #1a365d;
            color: white;
        }
        
        .standing-moyen {
            background: #4299e1;
            color: white;
        }
        
        .standing-standard {
            background: #a0aec0;
            color: white;
        }
        
        .property-title {
            font-size: 10pt;
            font-weight: bold;
            color: #1a365d;
            margin-bottom: 5px;
            line-height: 1.2;
        }
        
        .property-location {
            font-size: 8pt;
            color: #666;
            margin-bottom: 8px;
        }
        
        .property-features {
            display: flex;
            gap: 10px;
            font-size: 8pt;
            color: #555;
            margin-bottom: 8px;
        }
        
        .property-feature {
            display: flex;
            align-items: center;
            gap: 3px;
        }
        
        .property-price {
            font-size: 12pt;
            font-weight: bold;
            color: #22543d;
        }
        
        .property-type {
            font-size: 7pt;
            color: #888;
            text-transform: uppercase;
        }
        
        .property-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #e2e8f0;
        }
        
        .property-agent {
            font-size: 7pt;
            color: #666;
        }
        
        .property-qr {
            width: 40px;
            height: 40px;
        }
        
        /* Full Page Property */
        .property-full {
            page-break-inside: avoid;
        }
        
        .property-full-image {
            width: 100%;
            height: 200px;
            object-fit: cover;
            border-radius: 6px;
            margin-bottom: 15px;
        }
        
        .property-full-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
        }
        
        .property-full-title {
            font-size: 16pt;
            font-weight: bold;
            color: #1a365d;
        }
        
        .property-full-price {
            font-size: 18pt;
            font-weight: bold;
            color: #22543d;
        }
        
        .property-full-details {
            display: flex;
            gap: 30px;
            margin: 15px 0;
            padding: 15px;
            background: #f7fafc;
            border-radius: 6px;
        }
        
        .detail-item {
            text-align: center;
        }
        
        .detail-value {
            font-size: 14pt;
            font-weight: bold;
            color: #1a365d;
        }
        
        .detail-label {
            font-size: 8pt;
            color: #666;
            text-transform: uppercase;
        }
        
        .property-description {
            font-size: 10pt;
            line-height: 1.6;
            color: #444;
            margin: 15px 0;
        }
        
        .property-features-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 15px 0;
        }
        
        .feature-tag {
            background: #e2e8f0;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 8pt;
            color: #4a5568;
        }
        
        .property-contact {
            background: #1a365d;
            color: white;
            padding: 15px;
            border-radius: 6px;
            margin-top: 20px;
        }
        
        .contact-title {
            font-size: 10pt;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .contact-info {
            font-size: 9pt;
            line-height: 1.6;
        }
        
        .qr-section {
            text-align: center;
            margin-top: 15px;
        }
        
        .qr-code {
            width: 100px;
            height: 100px;
        }
        
        .qr-label {
            font-size: 8pt;
            color: #666;
            margin-top: 5px;
        }
        
        /* Footer */
        .footer {
            position: fixed;
            bottom: 10mm;
            left: 15mm;
            right: 15mm;
            text-align: center;
            font-size: 8pt;
            color: #888;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
        }
        
        .page-number:after {
            content: counter(page);
        }
        
        /* Table of Contents */
        .toc {
            margin: 20px 0;
        }
        
        .toc-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dotted #ccc;
        }
        
        .toc-standing {
            font-weight: bold;
            color: #1a365d;
        }
        
        .toc-count {
            color: #666;
        }
        
        /* Notes */
        .notes {
            background: #fffaf0;
            border: 1px solid #ed8936;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
        }
        
        .notes-title {
            font-weight: bold;
            color: #c05621;
            margin-bottom: 8px;
        }
        
        .notes-list {
            font-size: 9pt;
            color: #744210;
            padding-left: 15px;
        }
        
        .notes-list li {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <!-- Page de couverture -->
    <div class="page cover">
        <div class="logo">IMMO</div>
        <div class="tagline">Plateforme Immobilière Premium du Cameroun</div>
        
        <div class="cover-title">CATALOGUE EXCLUSIF</div>
        <div class="cover-subtitle">Sélection des meilleures propriétés</div>
        
        <div class="cover-stats">
            <div class="cover-stats-item">
                <strong>{{ $total_count }}</strong> propriétés sélectionnées
            </div>
            <div class="cover-stats-item">
                Généré le {{ $generated_at }}
            </div>
        </div>
        
        <div class="cover-price">
            2 000 FCFA
        </div>
        
        <div class="notes" style="margin-top: 40px; max-width: 400px;">
            <div class="notes-title">Comment utiliser ce catalogue</div>
            <ul class="notes-list">
                <li>Scannez le QR code pour voir les détails complets</li>
                <li>Contactez directement l'agent mentionné</li>
                <li>Les prix sont négociables dans la limite du raisonnable</li>
                <li>Visites sur rendez-vous uniquement</li>
            </ul>
        </div>
    </div>
    
    <!-- Table des matières -->
    <div class="page">
        <div class="header">
            <div class="logo">IMMO</div>
            <div class="catalog-info">Table des matières</div>
        </div>
        
        <div class="toc">
            @foreach($grouped_properties as $standing => $types)
                <div class="toc-item">
                    <span class="toc-standing">{{ $standing }}</span>
                    <span class="toc-count">{{ $types->flatten()->count() }} propriétés</span>
                </div>
                @foreach($types as $type => $props)
                    <div class="toc-item" style="padding-left: 20px;">
                        <span>{{ $type }}</span>
                        <span class="toc-count">{{ $props->count() }}</span>
                    </div>
                @endforeach
            @endforeach
        </div>
        
        <div class="notes">
            <div class="notes-title">Classification des biens</div>
            <ul class="notes-list">
                <li><strong>Haut de gamme</strong>: Propriétés luxueuses avec équipements premium</li>
                <li><strong>Moyen standing</strong>: Bon confort avec services de qualité</li>
                <li><strong>Standard</strong>: Logements fonctionnels et accessibles</li>
            </ul>
        </div>
    </div>
    
    <!-- Propriétés groupées -->
    @foreach($grouped_properties as $standing => $types)
        <div class="page">
            <div class="section-header">
                {{ strtoupper($standing) }}
            </div>
            
            @foreach($types as $type => $props)
                <div class="subsection-header">{{ $type }}</div>
                
                <div class="property-grid">
                    @foreach($props as $property)
                        <div class="property-card">
                            @if($property['main_image'])
                                <img src="{{ $property['main_image'] }}" alt="" class="property-image">
                            @else
                                <div class="property-image" style="display: flex; align-items: center; justify-content: center; background: #e2e8f0;">
                                    <span style="color: #a0aec0; font-size: 8pt;">Pas d'image</span>
                                </div>
                            @endif
                            
                            <div class="property-content">
                                <span class="property-standing standing-{{ str_replace(' ', '_', strtolower($property['standing'])) }}">
                                    {{ $property['standing'] }}
                                </span>
                                
                                <div class="property-title">{{ Str::limit($property['title'], 50) }}</div>
                                
                                <div class="property-location">
                                    {{ $property['quartier'] }}, {{ $property['city'] }}
                                </div>
                                
                                <div class="property-features">
                                    @if($property['area'])
                                        <span class="property-feature">{{ $property['area'] }} m²</span>
                                    @endif
                                    @if($property['bedrooms'])
                                        <span class="property-feature">{{ $property['bedrooms'] }} ch</span>
                                    @endif
                                    @if($property['bathrooms'])
                                        <span class="property-feature">{{ $property['bathrooms'] }} sdb</span>
                                    @endif
                                </div>
                                
                                <div class="property-footer">
                                    <div>
                                        <div class="property-price">{{ $property['price'] }}</div>
                                        <div class="property-type">{{ $property['transaction_type'] }}</div>
                                    </div>
                                    @if($property['qr_code'])
                                        <img src="data:image/png;base64,{{ $property['qr_code'] }}" alt="QR" class="property-qr">
                                    @endif
                                </div>
                                
                                <div class="property-agent">
                                    {{ $property['agent']['name'] }} • {{ $property['agent']['phone'] }}
                                </div>
                            </div>
                        </div>
                    @endforeach
                </div>
            @endforeach
        </div>
    @endforeach
    
    <!-- Page de fin -->
    <div class="page" style="text-align: center; padding-top: 100px;">
        <div class="logo" style="font-size: 48pt; margin-bottom: 30px;">IMMO</div>
        
        <p style="font-size: 12pt; color: #666; margin-bottom: 20px;">
            Merci de votre confiance
        </p>
        
        <p style="font-size: 10pt; color: #888;">
            Pour plus de propriétés, visitez notre site web
        </p>
        
        <div style="margin-top: 50px; padding: 20px; background: #f7fafc; border-radius: 8px;">
            <p style="font-size: 9pt; color: #666;">
                Ce catalogue est confidentiel et destiné à un usage personnel.<br>
                Toute reproduction est interdite sans autorisation.
            </p>
        </div>
    </div>
    
    <div class="footer">
        IMMO - Catalogue Premium du Cameroun - Page <span class="page-number"></span>
    </div>
</body>
</html>