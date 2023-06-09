/*
 * Copyright (c) 2008-2021, Massachusetts Institute of Technology (MIT)
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 * list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors
 * may be used to endorse or promote products derived from this software without
 * specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
define(["iweb/CoreModule", "iweb/modules/MapModule", "../Interactions", "ol"],
		function(Core, MapModule, Interactions, ol) {
	return Ext.define("drawmenu.MeasureController", {
		extend: 'Ext.app.ViewController',
		alias: "controller.drawmenu.measurebutton",

		init: function() {
			var defaultTool = this.getView().menu.lookupReference("distance");
			this.updateButton(this.getView(), defaultTool);
			defaultTool.toggle(true, true);
			this.measureMode = "LineString";
			this.measureUnits = "metric";

			this.onFeatureChange = this.onFeatureChange.bind(this);
		},

		updateButton: function(parent, button) {
			parent.setIcon(button.icon);
			parent.setIconCls(button.iconCls);
			parent.setTooltip(button.tooltip);
		},

		onToggle: function(btn, pressed) {
			if (!pressed) {
				this.removeLayer();
				this.hideFreehandButton();
				return;
			}

			if (!this.clickHandler) {
				this.clickHandler = this.onDistanceClick;
			}
			this.clickHandler(btn);
		},

		getLayer: function() {
			if (!this.layer) {
				this.layer = new ol.layer.Vector({
					source: new ol.source.Vector()
				});
				Core.Ext.Map.addLayer(this.layer);
			}
			return this.layer;
		},

		removeLayer: function(){
			if (this.layer) {
				Core.Ext.Map.removeLayer(this.layer);
				this.layer.getSource().clear();
				this.layer = null;
			}
		},

		isFreehand: function(callback){
			var freeHandButton = Ext.ComponentQuery.query('freehand-button');
			if (freeHandButton && freeHandButton.length) {
				return freeHandButton[0].pressed;
			}
		},

		setFreehandToggleCallback: function(callback){
			var freeHandButton = Ext.ComponentQuery.query('freehand-button');
			if (freeHandButton && freeHandButton.length) {
				this.hideFreehandButton();
				freeHandButton[0].addToggleCallback(callback);
				this.freehandEnabled = true;
			}
		},

		hideFreehandButton: function(){
			var freeHandButton = Ext.ComponentQuery.query('freehand-button');
			if (freeHandButton && freeHandButton.length && this.freehandEnabled) {
				freeHandButton[0].removeToggleCallback();
				this.freehandEnabled = false;
			}
		},

		onDistanceClick: function(btn) {
			this.measureMode = "LineString";
			var interactions = this.buildMeasureInteraction(this.measureMode, this.isFreehand());
			Core.Ext.Map.setInteractions(interactions);

			this.setFreehandToggleCallback(function(freehand){
				var interactions = this.buildMeasureInteraction(this.measureMode, freehand);
				Core.Ext.Map.setInteractions(interactions);
			}.bind(this));

			this.clickHandler = this.onDistanceClick;

			this.updateButton(this.getView(), btn);
			this.getView().toggle(true);
		},

		onAreaClick: function(btn, freehand) {
			this.measureMode = "Polygon";
			var interactions = this.buildMeasureInteraction(this.measureMode, this.isFreehand());
			Core.Ext.Map.setInteractions(interactions);

			this.setFreehandToggleCallback(function(freehand){
				var interactions = this.buildMeasureInteraction(this.measureMode, freehand);
				Core.Ext.Map.setInteractions(interactions);
			}.bind(this));

			this.clickHandler = this.onAreaClick;
			
			this.updateButton(this.getView(), btn);
			this.getView().toggle(true);
		},

		onUnitsCheckChange: function(checkItem, checked, eOpts) {
			if (checked) {
				this.measureUnits = checkItem.units;
			}
		},

		buildMeasureInteraction: function(type, freehand) {
			var method = (type === "LineString") ?
						Interactions.drawLine : Interactions.drawPolygon;
			var interactions = method(
				this.getLayer().getSource(),
				this.getDefaultMeasureStyle(),
				freehand
			);

			interactions.forEach(function(interaction){
				interaction.on("drawstart", this.onDrawStart.bind(this));
				interaction.on("drawend", this.onDrawEnd.bind(this));
			}.bind(this));
			
			return interactions;
		},

		onDrawStart: function(drawEvent) {
			var feature = drawEvent.feature;
			feature.setProperties({
				type: 'measure'
			});
			feature.setStyle(this.getDefaultMeasureStyle());
			feature.on("change", this.onFeatureChange);
		},

		onDrawEnd: function(drawEvent) {
			var feature = drawEvent.feature;
			feature.un("change", this.onFeatureChange);

			var style = feature.getStyle(),
					strokeStyle = style.getStroke(),
					textFill = style.getText().getFill();

			var yellowColor = 'rgba(255, 204, 51, 0.8)';
			textFill.setColor(yellowColor);
			strokeStyle.setColor(yellowColor);
			strokeStyle.setLineDash(null);
		},

		onFeatureChange: function(evt) {
			var feature = evt.target,
					geom = feature.getGeometry(),
					measure = null;

			if (geom instanceof ol.geom.Polygon) {
				var areaSqrMeter = this.calculateArea(geom);
				measure = this.formatArea(areaSqrMeter);
			} else if (geom instanceof ol.geom.LineString) {
				var lengthMeter = this.calculateLength(geom);
				measure = this.formatLength(lengthMeter);
			}
			
			if (measure) {
				feature.getStyle().getText().setText(measure);
			}
		},

		calculateLength: function(line) {
			var sourceProj = Core.Ext.Map.getMap().getView().getProjection();
			return ol.sphere.getLength(line,{ projection: sourceProj });
		},

		calculateArea: function(polygon) {
			var sourceProj = Core.Ext.Map.getMap().getView().getProjection();
			return ol.sphere.getArea(polygon, { projection: sourceProj });
		},

		formatLength: function(lengthMeter) {
			switch (this.measureUnits) {
				case "metric":
					return this.formatLengthMetric(lengthMeter);
				case "nautical":
					return this.formatLengthNautical(lengthMeter);
				case "imperial":
					//interntional fallthrough
				default:
					return this.formatLengthImperial(lengthMeter);
			}
		},

		M_PER_KM: 1000,
		formatLengthMetric: function(lengthMeter) {
			if (lengthMeter > (this.M_PER_KM / 10)) {
				return this.round(lengthMeter / this.M_PER_KM) + ' ' +  Core.Translate.i18nJSON('km');
			} else {
				return this.round(lengthMeter) + ' ' + Core.Translate.i18nJSON('m');
			}
		},
		
		FEET_PER_METER: 3.28084,
		FEET_PER_MILE: 5280,
		formatLengthImperial: function(lengthMeter){
			var lengthFeet = lengthMeter * this.FEET_PER_METER;
			if (lengthFeet > (this.FEET_PER_MILE / 10)) {
				return this.round(lengthFeet / this.FEET_PER_MILE) + ' ' + Core.Translate.i18nJSON('mi');
			} else {
				return this.round(lengthFeet) + ' ' + Core.Translate.i18nJSON('ft');
			}
		},
		
		METER_PER_NM: 1852,
		formatLengthNautical: function(lengthMeter){
			var lengthNM = lengthMeter / this.METER_PER_NM;
			return this.round(lengthNM) + ' nmi';
		},

		formatArea: function(areaSqrMeter) {
			switch (this.measureUnits) {
				case "metric":
					return this.formatAreaMetric(areaSqrMeter);
				case "nautical":
					return this.formatAreaNautical(areaSqrMeter);
				case "imperial":
					//interntional fallthrough
				default:
					return this.formatAreaImperial(areaSqrMeter);
			}
		},

		SQRM_PER_SQRKM: 1000000,
		formatAreaMetric: function(areaSqrMeter) {
			if (areaSqrMeter > (this.SQRM_PER_SQRKM / 10)) {
				return this.round(areaSqrMeter / this.SQRM_PER_SQRKM) + ' ' + Core.Translate.i18nJSON('km²');
			} else {
				return this.round(areaSqrMeter) + ' ' + Core.Translate.i18nJSON('m²');
			}
		},
		
		SQRFEET_PER_SQRMETER: 10.7639,
		SQRFEET_PER_ACRE: 43560,
		formatAreaImperial: function(areaSqrMeter){
			var areaSqrFeet = areaSqrMeter * this.SQRFEET_PER_SQRMETER;
			if (areaSqrFeet > (this.SQRFEET_PER_ACRE / 10)) {
				return this.round(areaSqrFeet / this.SQRFEET_PER_ACRE) + ' ' + Core.Translate.i18nJSON('acres');
			} else {
				return this.round(areaSqrFeet) + ' ' + Core.Translate.i18nJSON('ft²');
			}
		},

		SQRMETER_PER_SQRNM: 3429904,
		formatAreaNautical: function(areaSqrMeter){
			var areaNM = areaSqrMeter / this.SQRMETER_PER_SQRNM;
			return this.round(areaNM) + ' nmi²';
		},

		round: function(value) {
			return (Math.round(value * 100) / 100);
		},

		getDefaultMeasureStyle: function() {
			return new ol.style.Style({
				text: this.getDefaultTextStyle(),
				fill: new ol.style.Fill({
					color: 'rgba(255, 255, 255, 0.2)'
				}),
				stroke: new ol.style.Stroke({
					color: 'rgba(0, 0, 0, 0.5)',
					lineDash: [10, 10],
					width: 3
				}),
				image: new ol.style.Circle({
					radius: 5,
					stroke: new ol.style.Stroke({
						color: 'rgba(0, 0, 0, 0.7)'
					}),
					fill: new ol.style.Fill({
						color: 'rgba(255, 255, 255, 0.2)'
					})
				})
			});
		},
		
		getDefaultMeasureTextStyle: function() {
			return new ol.style.Style({
				text: this.getDefaultTextStyle()
			});
		},
		
		getDefaultTextStyle: function() {
			return new ol.style.Text({
				text: "",
				textAlign: 'center',
				fill: new ol.style.Fill({
					color: 'rgb(255, 255, 255)'
				}),
				stroke: new ol.style.Stroke({
					color: 'rgb(0, 0, 0)',
					width: 2
				}),
				scale: 1.5,
				font: '12px arial',
				overflow: true
			});
		}
	});

});
