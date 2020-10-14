/// <reference types="cypress" />

context('Actions', () => {


  describe('My First Test', () => {
    it('Select SceneId from dropdown', () => {
      cy.visit('localhost:3000')      
    })
    it('2D Loaded', () => {
      cy.get('canvas')
    })
    it('Date Picker', () => {
      cy.get('[data-cy=today]').click()
      cy.get('[data-cy=tomorrow]').click()
      cy.get('.ant-picker')
    })

    it('Slider Loaded', () => {
      cy.get('.ant-slider-handle')
    })

 
    
  
  

    // it('Select SceneId from dropdown', () => {
     
    //   cy.get('.ant-select-selector .ant-select-selection-search').click({force:true}).get('.ant-select-item').last().click()
      
    // })
  
    // it('Select SceneId from Map', () => {
     
    //   cy.get('#mapIcon').click().as('mapboxView')
    //   cy.wait(11000);
    //   cy.get('.mapboxgl-marker').last().click()
      
    // })
  
    // it('Metrics loaded?', () => {
    //   cy.get('[data-cy=seats]').should('not.have.text', '');
    // })
  

  
    // it('3d loaded?', () => {
    //   cy.get('.ant-picker')
    // })
  
    // it('Table loaded?', () => {
  
    //   cy.get('.ant-table-tbody').find('tr').should('have.length.greaterThan', 1) 
        
    // })
  
  
  })
  
  
})














